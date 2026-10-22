/**
 * Where "Buy" goes. Every piece sends the shopper to the brand's own site:
 *  1. the product page itself when we have it (`product.sourceUrl`, filled in by catalogue ingestion), or
 *  2. the brand's on-site search for that exact piece, which lands on the product listing.
 * Offers from other retailers and resale sites link to that store's search the same way.
 * Links carry utm_source=forya so traffic can be attributed (and swapped for affiliate links later).
 */
import type { Product } from './types';

type Search = (q: string) => string;

const q = encodeURIComponent;

/** Brand → search URL for the UK store. */
const BRAND_SEARCH: Record<string, Search> = {
  // Affordable
  Zara: (s) => `https://www.zara.com/uk/en/search?searchTerm=${q(s)}`,
  'H&M': (s) => `https://www2.hm.com/en_gb/search-results.html?q=${q(s)}`,
  Mango: (s) => `https://shop.mango.com/gb/en/search?q=${q(s)}`,
  ASOS: (s) => `https://www.asos.com/search/?q=${q(s)}`,
  Uniqlo: (s) => `https://www.uniqlo.com/uk/en/search?q=${q(s)}`,
  'Pretty Little Thing': (s) => `https://www.prettylittlething.com/search?q=${q(s)}`,
  'Urban Outfitters': (s) => `https://www.urbanoutfitters.com/en-gb/search?q=${q(s)}`,
  // Attainable
  COS: (s) => `https://www.cos.com/en-gb/search?q=${q(s)}`,
  'Massimo Dutti': (s) => `https://www.massimodutti.com/gb/search?term=${q(s)}`,
  Reiss: (s) => `https://www.reiss.com/search?q=${q(s)}`,
  '7 For All Mankind': (s) => `https://uk.7forallmankind.com/search?q=${q(s)}`,
  AllSaints: (s) => `https://www.allsaints.com/search?q=${q(s)}`,
  Sandro: (s) => `https://uk.sandro-paris.com/en/search?q=${q(s)}`,
  Maje: (s) => `https://uk.maje.com/en/search?q=${q(s)}`,
  // Aspirational
  Fendi: (s) => `https://www.fendi.com/gb-en/search?q=${q(s)}`,
  'Dolce&Gabbana': (s) => `https://www.dolcegabbana.com/en-gb/search/?q=${q(s)}`,
  Dior: (s) => `https://www.dior.com/en_gb/search?query=${q(s)}`,
  'Salvatore Ferragamo': (s) => `https://www.ferragamo.com/gb/en/search?q=${q(s)}`,
  Gucci: (s) => `https://www.gucci.com/uk/en_gb/search?searchString=${q(s)}`,
  Farfetch: (s) => `https://www.farfetch.com/uk/shopping/search/items.aspx?q=${q(s)}`,
  Flannels: (s) => `https://www.flannels.com/searchresults?descriptionfilter=${q(s)}`,
  'River Island': (s) => `https://www.riverisland.com/search?keyword=${q(s)}`,
  Next: (s) => `https://www.next.co.uk/search?w=${q(s)}`,
  Topshop: (s) => `https://www.asos.com/search/?q=${q(`Topshop ${s}`)}`,
  '& Other Stories': (s) => `https://www.stories.com/en_gbp/search.html?q=${q(s)}`,
  'New Look': (s) => `https://www.newlook.com/uk/search?text=${q(s)}`,
  'M&S': (s) => `https://www.marksandspencer.com/l/search?q=${q(s)}`,
  Cider: (s) => `https://www.shopcider.com/search?keyword=${q(s)}`,
  Theory: (s) => `https://www.theory.com/search?q=${q(s)}`,
  'Zadig & Voltaire': (s) => `https://zadig-et-voltaire.com/eu/uk/search?q=${q(s)}`,
  'Holland Cooper': (s) => `https://www.hollandcooper.com/search?q=${q(s)}`,
  Boss: (s) => `https://www.hugoboss.com/uk/search?q=${q(s)}`,
  Varley: (s) => `https://www.varley.com/search?q=${q(s)}`,
  Joseph: (s) => `https://www.joseph-fashion.com/en-gb/search?q=${q(s)}`,
  'Club Monaco': (s) => `https://www.clubmonaco.com/en/search?q=${q(s)}`,
  'Maniere De Voir': (s) => `https://www.manieredevoir.com/search?q=${q(s)}`,
  'Miu Miu': (s) => `https://www.miumiu.com/gb/en/search.html?q=${q(s)}`,
  'Canada Goose': (s) => `https://www.canadagoose.com/gb/en/search?q=${q(s)}`,
  Moncler: (s) => `https://www.moncler.com/en-gb/search?q=${q(s)}`,
  Zimmermann: (s) => `https://www.zimmermann.com/gb/catalogsearch/result/?q=${q(s)}`,
  'Loro Piana': (s) => `https://uk.loropiana.com/en/search?text=${q(s)}`,
  'Louis Vuitton': (s) => `https://uk.louisvuitton.com/eng-gb/search/${q(s)}`,
  Prada: (s) => `https://www.prada.com/gb/en/search.html?q=${q(s)}`,
  'Bottega Veneta': (s) => `https://www.bottegaveneta.com/en-gb/search?q=${q(s)}`,
  Burberry: (s) => `https://uk.burberry.com/search/?q=${q(s)}`,
  LoveShackFancy: (s) => `https://www.loveshackfancy.com/search?q=${q(s)}`,
  'Saint Laurent': (s) => `https://www.ysl.com/en-gb/search?q=${q(s)}`,
  'Brunello Cucinelli': (s) => `https://shop.brunellocucinelli.com/en-gb/search?q=${q(s)}`,
  Celine: (s) => `https://www.celine.com/en-gb/search?q=${q(s)}`,
  'Alexander McQueen': (s) => `https://www.alexandermcqueen.com/en-gb/search?q=${q(s)}`,
  'Valentino Garavani': (s) => `https://www.valentino.com/en-gb/search?q=${q(s)}`,
  'Maison Margiela': (s) => `https://www.maisonmargiela.com/en-gb/search?q=${q(s)}`,
  Alaia: (s) => `https://www.maison-alaia.com/gb/search?q=${q(s)}`,
  Jacquemus: (s) => `https://www.jacquemus.com/en_gb/search?q=${q(s)}`,
  // Retailers and resale sites that appear in price checks
  'John Lewis': (s) => `https://www.johnlewis.com/search?search-term=${q(s)}`,
  Selfridges: (s) => `https://www.selfridges.com/GB/en/cat/?freeText=${q(s)}`,
  Harrods: (s) => `https://www.harrods.com/en-gb/search?query=${q(s)}`,
  Mytheresa: (s) => `https://www.mytheresa.com/gb/en/search?q=${q(s)}`,
  Vinted: (s) => `https://www.vinted.co.uk/catalog?search_text=${q(s)}`,
  Depop: (s) => `https://www.depop.com/search/?q=${q(s)}`,
  'Vestiaire Collective': (s) => `https://www.vestiairecollective.com/search/?q=${q(s)}`,
  'The RealReal': (s) => `https://www.therealreal.com/products?keywords=${q(s)}`,
};

const withUtm = (url: string) => {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'forya');
    u.searchParams.set('utm_medium', 'referral');
    return u.toString();
  } catch {
    return url;
  }
};

/** What to type into a store's search: drop the brand's own prefix ("ASOS DESIGN …") and keep the colour. */
function searchTerms(p: Product, store: string) {
  const name = p.name.replace(new RegExp(`^${store.replace(/[^\w]/g, '.?')}\\s*(DESIGN\\s*)?`, 'i'), '');
  return `${p.colorName} ${name}`.replace(/\s+/g, ' ').trim();
}

/** The brand's own page for this piece. */
export function brandUrl(p: Product) {
  if (p.sourceUrl) return withUtm(p.sourceUrl);
  const search = BRAND_SEARCH[p.brand];
  return withUtm(search ? search(searchTerms(p, p.brand)) : `https://www.google.com/search?q=${q(`${p.brand} ${p.name}`)}`);
}

/** A store's page for this piece (used for offers from other retailers and resale sites). */
export function storeUrl(store: string, p: Product) {
  if (store === p.brand) return brandUrl(p);
  const search = BRAND_SEARCH[store];
  const term = `${p.brand} ${searchTerms(p, p.brand)}`;
  return withUtm(search ? search(term) : `https://www.google.com/search?q=${q(`${store} ${term}`)}`);
}

/** "Zara" for brands, "Farfetch" for stockists. */
export const buyLabel = (p: Product) => `Buy at ${p.brand}`;
