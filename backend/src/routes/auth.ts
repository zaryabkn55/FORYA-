import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/config';
import { AuthRequest, requireAuth, signToken } from '../middlewares/auth';
import { toUser } from '../lib/mappers';
import { DEFAULT_COUNTRY, codeForCountry } from '../lib/countries';

const router = Router();

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  country: z.string().optional().default(DEFAULT_COUNTRY),
  // Left undefined rather than defaulted, so we can tell "the client didn't send one" from
  // "the client sent GB" and derive it from the country name in the first case.
  countryCode: z
    .string()
    .regex(/^[A-Za-z]{2}$/, 'Country code must be two letters')
    .optional(),
  phone: z.string().optional(),
  shopsFor: z.enum(['women', 'men']).optional(),
});

const ProfileSchema = z.object({
  name: z.string().min(2).optional(),
  country: z.string().optional(),
  shopsFor: z.enum(['women', 'men']).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message });
  }

  const { fullName, email, password, country, countryCode, phone, shopsFor } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        passwordHash,
        country,
        // The form sends a name, not a code; derive it so a Dublin or Paris member isn't
        // filed as GB.
        countryCode: countryCode ? countryCode.toUpperCase() : codeForCountry(country),
        phone,
        shopsFor,
      },
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: toUser(user),
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid email and password are required.' });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'That email and password don’t match.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'That email and password don’t match.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: toUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during sign in.' });
  }
});

// POST /api/auth/oauth: PLACEHOLDER until Google / Apple sign-in is configured. Creates a throwaway account.
router.post('/oauth', async (req: Request, res: Response) => {
  const { provider } = req.body;
  const mockEmail = `member_${Date.now()}@${provider || 'oauth'}.com`;

  try {
    let user = await prisma.user.findUnique({ where: { email: mockEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: 'FORYA Member',
          email: mockEmail,
          passwordHash: await bcrypt.hash('oauth_forya_auto_pw', 8),
          country: 'United Kingdom',
          countryCode: 'GB',
        },
      });
    }

    const token = signToken(user);

    res.json({
      token,
      user: toUser(user),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'OAuth authentication failed.' });
  }
});

// POST /api/auth/forgot-password: always 200 so it can't be used to find out who has an account.
// TODO: send the reset email (e.g. Resend/Postmark) with a signed, one-hour token.
router.post('/forgot-password', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').toLowerCase().trim();
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (user) console.info(`[auth] password reset requested for ${user.id}`);
  }
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json(toUser(user));
});

// PATCH /api/auth/me: name, country, and the department (womenswear or menswear).
router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = ProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const { name, country, shopsFor } = parsed.data;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name ? { fullName: name } : {}),
      // Country and code move together: updating one and not the other leaves the account
      // saying "France" with a GB code.
      ...(country ? { country, countryCode: codeForCountry(country) } : {}),
      ...(shopsFor ? { shopsFor } : {}),
    },
  });
  res.json(toUser(user));
});

export default router;