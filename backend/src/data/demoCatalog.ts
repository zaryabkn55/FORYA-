import { FORYA_BRANDS } from '../services/brandCatalog';
import type { ScrapedProduct } from '../services/scraper';

/**
 * DEMO ONLY: stock photography + invented names/prices.
 * Never used by default. Enabled only via POST /api/products/sync-all-brands?demo=true
 * SKUs are prefixed DEMO_ so they can be told apart (and deleted) later.
 */
export function buildDemoCatalog(): ScrapedProduct[] {
  const catalog: ScrapedProduct[] = [];
  // Authentic Fashion Studio Product Photography (Pure Cutout Apparel)
  const VAULT: Record<string, { name: string; image: string; price: number; material: string }[]> = {
    Denim: [
      {
        name: 'Straight Leg Rigid Selvedge Jeans',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85',
        price: 65,
        material: '100% Kuroki Denim Cotton',
      },
      {
        name: 'Classic Vintage Wash Relaxed Denim',
        image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=85',
        price: 55,
        material: '13oz Japanese Ring-Spun Cotton',
      },
      {
        name: 'Indigo Clean Tapered Cut Jeans',
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=85',
        price: 70,
        material: 'Raw Rigid Twill',
      },
    ],
    Knitwear: [
      {
        name: 'Fine Gauge Merino Crewneck Knit',
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=85',
        price: 90,
        material: '100% Extra-Fine Merino Wool',
      },
      {
        name: 'Chunky Ribbed Wool Cardigan',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85',
        price: 110,
        material: 'Pure Lambswool',
      },
      {
        name: 'Seamless Lightweight Turtleneck Jumper',
        image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=900&q=85',
        price: 85,
        material: 'Cashmere & Silk Twist',
      },
    ],
    Outerwear: [
      {
        name: 'Manteco Wool Blend Double-Breasted Coat',
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=900&q=85',
        price: 189,
        material: 'Manteco Italian Wool Blend',
      },
      {
        name: 'Classic Storm-Proof Gabardine Trench',
        image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=85',
        price: 220,
        material: 'Weatherproof Compact Twill',
      },
      {
        name: 'Supple Lambskin Minimalist Jacket',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85',
        price: 350,
        material: '100% Full-Grain Leather',
      },
    ],
    Tops: [
      {
        name: 'Relaxed Tailored Poplin Shirt',
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85',
        price: 45,
        material: '100% Crisp Giza Cotton',
      },
      {
        name: 'Heavyweight Minimalist Cotton T-Shirt',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=85',
        price: 35,
        material: '260 GSM Organic Combed Cotton',
      },
    ],
    Tailoring: [
      {
        name: 'Structured Single-Breasted Wool Blazer',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85',
        price: 295,
        material: 'Super 120s Italian Flannel',
      },
      {
        name: 'Pleated Straight Leg Tailored Trousers',
        image: 'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=900&q=85',
        price: 135,
        material: 'Wool Gabardine Blend',
      },
    ],
    Bags: [
      {
        name: 'Smooth Calfskin Structured Shoulder Bag',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85',
        price: 850,
        material: 'Fine Grain Nappa Leather',
      },
    ],
    Footwear: [
      {
        name: 'Chunky Lug-Sole Leather Penny Loafers',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85',
        price: 240,
        material: 'Spazzolato Italian Leather',
      },
    ],
    Dresses: [
      {
        name: 'Bias-Cut Silk Satin Evening Dress',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85',
        price: 280,
        material: '100% Pure Mulberry Silk',
      },
    ],
    Bottoms: [
      {
        name: 'High-Waisted Structured Trousers',
        image: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=900&q=85',
        price: 85,
        material: 'Tropical Stretch Wool',
      },
    ],
  };

  for (const b of FORYA_BRANDS) {
    const pieces = VAULT[b.defaultCategory] || VAULT['Tops'];
    const multiplier = b.tier === 'AFFORDABLE' ? 1.0 : b.tier === 'ATTAINABLE' ? 2.2 : 5.8;
    pieces.forEach((p, idx) => {
      const price = Math.round(p.price * multiplier);
      catalog.push({
        sku: `DEMO_${b.name.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}_00${idx + 1}`,
        name: `${b.name} ${p.name}`,
        brand: b.name,
        category: b.defaultCategory,
        tier: b.tier,
        price: `£${price.toFixed(2)}`,
        numericPrice: price,
        imageUrl: p.image,
        color: '#1A1918',
        colorName: 'Noir',
        material: p.material,
        description: `Demo placeholder item for ${b.name}.`,
        sourceUrl: `https://${b.domain}`,
      });
    });
  }
  return catalog;
}
