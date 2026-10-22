/**
 * FORYA AI: a thin, budgeted proxy to Claude for the web app's stylist features.
 *
 * The key lives here, never in the browser, so this endpoint spends real money and is
 * treated accordingly: sign-in required, a per-user hourly ceiling and a whole-server daily
 * ceiling (see lib/aiBudget). Set ANTHROPIC_API_KEY to turn it on. Without a key — or once
 * the daily budget is spent — the web app falls back to its on-device stylist engine, which
 * is why every failure path here is a clean status code rather than an error page.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../env';
import { AuthRequest, requireAuth } from '../middlewares/auth';
import { aiBudgetSnapshot, claimAiCall } from '../lib/aiBudget';

const router = Router();

const KEY = env.ai.key;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(24_000) }))
    .min(1)
    .max(20),
  quick: z.boolean().optional(),
});

/** Total characters across the conversation, so a caller can't send 20 × 24k every time. */
const MAX_TOTAL_CHARS = 60_000;

/** Upstream calls get a ceiling of their own: a hung connection shouldn't tie up a worker. */
const UPSTREAM_TIMEOUT_MS = 45_000;

router.get('/status', (_req: Request, res: Response) => {
  const budget = aiBudgetSnapshot(env.ai.dailyCalls);
  res.json({
    enabled: !!KEY && budget.remaining > 0,
    model: KEY ? env.ai.model : null,
    // Deliberately coarse: enough for the client to decide, nothing useful to an attacker.
    budgetRemaining: KEY ? budget.remaining > 0 : false,
  });
});

// POST /api/ai/complete { messages, quick? } → { text }
router.post('/complete', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!KEY) return res.status(501).json({ error: 'AI is not configured on this server.' });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const { messages, quick } = parsed.data;

  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) return res.status(413).json({ error: 'That conversation is too long.' });

  const verdict = claimAiCall(req.user!.id, { userHourlyCalls: env.ai.userHourlyCalls, dailyCalls: env.ai.dailyCalls });
  if (!verdict.ok) {
    if (verdict.reason === 'user') {
      res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
      return res.status(429).json({ error: 'You have asked the stylist a lot in the last hour. Try again shortly.' });
    }
    // Daily ceiling: the client treats this as "unavailable" and uses the on-device stylist.
    console.warn('[ai] daily budget exhausted');
    return res.status(429).json({ error: 'The stylist is resting. Using the on-device stylist for now.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: quick ? env.ai.modelQuick : env.ai.model,
        max_tokens: env.ai.maxOutputTokens,
        system:
          "You are FORYA's personal stylist. Follow the user's formatting instructions exactly; when asked for JSON, reply with JSON only.",
        messages,
      }),
    });

    if (!r.ok) {
      // Log the status, never the body: upstream errors can echo the request back.
      console.error('[ai] upstream error', r.status);
      return res.status(502).json({ error: 'The stylist is unavailable right now.' });
    }

    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    res.json({ text });
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError';
    console.error('[ai] request failed', aborted ? 'timeout' : (err as Error)?.message);
    res.status(504).json({ error: 'The stylist took too long. Please try again.' });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
