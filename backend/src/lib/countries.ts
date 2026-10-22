/**
 * Country name → ISO 3166-1 alpha-2.
 *
 * The registration form sends a country *name* picked from a fixed list and no code, so
 * without this every account was stored as GB regardless of what the member chose. The map
 * covers the list the form offers; anything else falls back to GB, which is the launch market.
 *
 * Keep this in step with COUNTRIES in frontend/src/pages/Register.tsx.
 */
const CODES: Record<string, string> = {
  'united kingdom': 'GB',
  ireland: 'IE',
  'united states': 'US',
  france: 'FR',
  germany: 'DE',
  italy: 'IT',
  spain: 'ES',
  netherlands: 'NL',
  'united arab emirates': 'AE',
  pakistan: 'PK',
  india: 'IN',
  australia: 'AU',
  canada: 'CA',
};

export const DEFAULT_COUNTRY = 'United Kingdom';
export const DEFAULT_COUNTRY_CODE = 'GB';

/** The ISO code for a country name, or the launch market's code if we don't recognise it. */
export function codeForCountry(country: string | undefined, fallback = DEFAULT_COUNTRY_CODE): string {
  if (!country) return fallback;
  return CODES[country.trim().toLowerCase()] ?? fallback;
}
