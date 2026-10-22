/**
 * Where to scrape each brand from (key = brand name exactly as in brandCatalog.ts).
 *
 *  - catalogUrls : listing pages ("New In", "Women > Coats" ...). The scraper discovers product links on them.
 *  - productUrls : exact product pages you always want in the catalogue.
 *
 * Brands that are not listed here fall back to crawling https://www.<domain> and following
 * "new in / women / men / collection" links. That works for many shops, but for the ones that
 * report "No product links found" in the sync report, paste a real listing URL here
 * (open the brand's site -> New In -> copy the address bar).
 */
export interface BrandSource {
  catalogUrls?: string[];
  productUrls?: string[];
}

export const BRAND_SOURCES: Record<string, BrandSource> = {
  // Zara's root domain is only a country picker, so it needs explicit listing pages.
  // (I could not open these from my sandbox: if one shows "No product links found", paste the
  //  URL you get by opening zara.com -> Woman/Man -> New In in your browser.)
  Zara: {
    catalogUrls: [
      'https://www.zara.com/us/en/woman-new-in-l1180.html',
      'https://www.zara.com/us/en/man-new-in-l711.html',
    ],
    // Pants link you already verified with /diagnose works as a guaranteed first product:
    productUrls: ['https://www.zara.com/us/en/relaxed-fit-pleated-pants-p08281740.html'],
  },
  // Other brands: add the same way, e.g.
  // 'H&M': { catalogUrls: ['https://www2.hm.com/en_gb/ladies/new-arrivals/clothes.html'] },
  // 'H&M': { catalogUrls: ['https://www2.hm.com/en_gb/ladies/new-arrivals/clothes.html'] },
};
