export interface BrandRegistryItem {
  name: string;
  tier: 'AFFORDABLE' | 'ATTAINABLE' | 'ASPIRATIONAL';
  domain: string;
  defaultCategory: string;
}

export const FORYA_BRANDS: BrandRegistryItem[] = [
  // --- AFFORDABLE (14 Brands) ---
  { 
    name: 'Zara', 
    tier: 'AFFORDABLE', 
    domain: 'zara.com', 
    defaultCategory: 'Tops' 
},
  { 
    name: 'H&M', 
    tier: 'AFFORDABLE', 
    domain: 'hm.com', 
    defaultCategory: 'Tops' 
},
  { 
    name: 'Mango', 
    tier: 'AFFORDABLE', 
    domain: 'mango.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'ASOS', 
    tier: 'AFFORDABLE', 
    domain: 'asos.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Uniqlo', 
    tier: 'AFFORDABLE', 
    domain: 'uniqlo.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'Pretty Little Thing', 
    tier: 'AFFORDABLE', 
    domain: 'prettylittlething.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Urban Outfitters', 
    tier: 'AFFORDABLE', 
    domain: 'urbanoutfitters.com', 
    defaultCategory: 'Bottoms' 
},
  { 
    name: 'River Island', 
    tier: 'AFFORDABLE', 
    domain: 'riverisland.com', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Next', 
    tier: 'AFFORDABLE', 
    domain: 'next.co.uk', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Topshop', 
    tier: 'AFFORDABLE', 
    domain: 'asos.com/topshop', 
    defaultCategory: 'Denim' 
  },
  { 
    name: '& Other Stories', 
    tier: 'AFFORDABLE', 
    domain: 'stories.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'New Look', 
    tier: 'AFFORDABLE', 
    domain: 'newlook.com', 
    defaultCategory: 'Footwear' 
},
  { 
    name: 'M&S', 
    tier: 'AFFORDABLE', 
    domain: 'marksandspencer.com', 
    defaultCategory: 'Tops' 
},
  { 
    name: 'Cider', 
    tier: 'AFFORDABLE', 
    domain: 'shopcider.com', 
    defaultCategory: 'Dresses' 
 },

  // --- ATTAINABLE (15 Brands) ---
  { 
    name: 'COS', 
    tier: 'ATTAINABLE', 
    domain: 'cos.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'Massimo Dutti', 
    tier: 'ATTAINABLE', 
    domain: 'massimodutti.com', 
    defaultCategory: 'Tailoring' 
 },
  { 
    name: 'Reiss', 
    tier: 'ATTAINABLE', 
    domain: 'reiss.com', 
    defaultCategory: 'Tailoring' 
 },
  { 
    name: '7 For All Mankind', 
    tier: 'ATTAINABLE', 
    domain: '7forallmankind.co.uk', 
    defaultCategory: 'Denim' 
},
  { 
    name: 'AllSaints', 
    tier: 'ATTAINABLE', 
    domain: 'allsaints.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Sandro', 
    tier: 'ATTAINABLE', 
    domain: 'sandro-paris.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Maje', 
    tier: 'ATTAINABLE', 
    domain: 'maje.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Theory', 
    tier: 'ATTAINABLE', 
    domain: 'theory.com', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Zadig & Voltaire', 
    tier: 'ATTAINABLE', 
    domain: 'zadig-et-voltaire.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'Holland Cooper', 
    tier: 'ATTAINABLE', 
    domain: 'hollandcooper.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Boss', 
    tier: 'ATTAINABLE', 
    domain: 'hugoboss.com', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Varley', 
    tier: 'ATTAINABLE', 
    domain: 'varley.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'Joseph', 
    tier: 'ATTAINABLE', 
    domain: 'joseph-fashion.com', 
    defaultCategory: 'Tops' 
},
  { 
    name: 'Club Monaco', 
    tier: 'ATTAINABLE', 
    domain: 'clubmonaco.com', 
    defaultCategory: 'Tops' 
},
  { 
    name: 'Maniere De Voir', 
    tier: 'ATTAINABLE', 
    domain: 'manieredevoir.com', 
    defaultCategory: 'Outerwear' 
},

  // --- ASPIRATIONAL (28 Brands & Retail Curators) ---
  { 
    name: 'Fendi', 
    tier: 'ASPIRATIONAL', 
    domain: 'fendi.com', 
    defaultCategory: 'Bags' 
},
  { 
    name: 'D&G', 
    tier: 'ASPIRATIONAL', 
    domain: 'dolcegabbana.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Dior', 
    tier: 'ASPIRATIONAL', 
    domain: 'dior.com', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Salvatore Ferragamo', 
    tier: 'ASPIRATIONAL', 
    domain: 'ferragamo.com', 
    defaultCategory: 'Footwear' 
},
  { 
    name: 'Gucci', 
    tier: 'ASPIRATIONAL', 
    domain: 'gucci.com', 
    defaultCategory: 'Bags' 
},
  { 
    name: 'Farfetch', 
    tier: 'ASPIRATIONAL', 
    domain: 'farfetch.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Flannels', 
    tier: 'ASPIRATIONAL', 
    domain: 'flannels.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Harrods', 
    tier: 'ASPIRATIONAL', 
    domain: 'harrods.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Selfridges', 
    tier: 'ASPIRATIONAL', 
    domain: 'selfridges.com', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Mytheresa', 
    tier: 'ASPIRATIONAL', 
    domain: 'mytheresa.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Miu Miu', 
    tier: 'ASPIRATIONAL', 
    domain: 'miumiu.com', 
    defaultCategory: 'Footwear' 
},
  { 
    name: 'Canada Goose', 
    tier: 'ASPIRATIONAL', 
    domain: 'canadagoose.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Moncler', 
    tier: 'ASPIRATIONAL', 
    domain: 'moncler.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'Zimmermann', 
    tier: 'ASPIRATIONAL', 
    domain: 'zimmermann.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Loro Piana', 
    tier: 'ASPIRATIONAL', 
    domain: 'loropiana.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'Louis Vuitton', 
    tier: 'ASPIRATIONAL', 
    domain: 'louisvuitton.com', 
    defaultCategory: 'Bags' 
},
  { 
    name: 'Prada', 
    tier: 'ASPIRATIONAL', 
    domain: 'prada.com', 
    defaultCategory: 'Footwear' 
},
  { 
    name: 'Bottega Veneta', 
    tier: 'ASPIRATIONAL', 
    domain: 'bottegaveneta.com', 
    defaultCategory: 'Bags' 
},
  { 
    name: 'Burberry', 
    tier: 'ASPIRATIONAL', 
    domain: 'burberry.com', 
    defaultCategory: 'Outerwear' 
},
  { 
    name: 'LoveShackFancy', 
    tier: 'ASPIRATIONAL', 
    domain: 'loveshackfancy.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Saint Laurent', 
    tier: 'ASPIRATIONAL', 
    domain: 'ysl.com', 
    defaultCategory: 'Tailoring' 
},
  { 
    name: 'Brunello Cucinelli', 
    tier: 'ASPIRATIONAL', 
    domain: 'brunellocucinelli.com', 
    defaultCategory: 'Knitwear' 
},
  { 
    name: 'Celine', 
    tier: 'ASPIRATIONAL', 
    domain: 'celine.com', 
    defaultCategory: 'Bags' 
},
  { 
    name: 'Alexander McQueen', 
    tier: 'ASPIRATIONAL', 
    domain: 'alexandermcqueen.com', 
    defaultCategory: 'Footwear' }
    ,
  { 
    name: 'Valentino Garavani', 
    tier: 'ASPIRATIONAL', 
    domain: 'valentino.com', 
    defaultCategory: 'Bags' 
},
  { 
    name: 'Maison Margiela', 
    tier: 'ASPIRATIONAL', 
    domain: 'maisonmargiela.com', 
    defaultCategory: 'Footwear' 
},
  { 
    name: 'Alaïa', 
    tier: 'ASPIRATIONAL', 
    domain: 'maison-alaia.com', 
    defaultCategory: 'Dresses' 
},
  { 
    name: 'Jacquemus', 
    tier: 'ASPIRATIONAL', 
    domain: 'jacquemus.com', 
    defaultCategory: 'Bags' 
},
];