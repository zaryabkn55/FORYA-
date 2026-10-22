export type Tier = 'Affordable' | 'Attainable' | 'Aspirational';

export const BRANDS_BY_TIER: Record<Tier, string[]> = {
  Affordable: ['Zara','H&M','Mango','ASOS','Uniqlo','Pretty Little Thing','Urban Outfitters','River Island','Next','Topshop','& Other Stories','New Look','M&S','Cider'],
  Attainable: ['COS','Massimo Dutti','Reiss','7 For All Mankind','AllSaints','Sandro','Maje','Theory','Zadig & Voltaire','Holland Cooper','Boss','Varley','Joseph','Club Monaco','Maniere De Voir'],
  Aspirational: ['Fendi','Dolce&Gabbana','Dior','Salvatore Ferragamo','Gucci','Farfetch','Flannels','Harrods','Selfridges','Mytheresa','Miu Miu','Canada Goose','Moncler','Zimmermann','Loro Piana','Louis Vuitton','Prada','Bottega Veneta','Burberry','LoveShackFancy','Saint Laurent','Brunello Cucinelli','Celine','Alexander McQueen','Valentino Garavani','Maison Margiela','Alaia','Jacquemus'],
};

export const TIER_OF_BRAND: Record<string, Tier> = Object.fromEntries(
  (Object.keys(BRANDS_BY_TIER) as Tier[]).flatMap((t) => BRANDS_BY_TIER[t].map((b) => [b, t]))
);

/** The brands FORYA launches with: the whole list (see src/lib/foryaCatalogue.ts). */
export const LAUNCH_BRANDS: Record<Tier, string[]> = {
  Affordable: BRANDS_BY_TIER.Affordable,
  Attainable: BRANDS_BY_TIER.Attainable,
  Aspirational: BRANDS_BY_TIER.Aspirational,
};
