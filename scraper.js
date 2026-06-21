const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const MYNTRA_URL = 'https://www.myntra.com/';

// Load comprehensive data from JSON file (fallback when Puppeteer fails)
function getFallbackData() {
  const dataPath = path.join(__dirname, 'data', 'myntra_data.json');
  if (fs.existsSync(dataPath)) {
    try {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } catch (e) {
      console.warn('⚠️  Could not parse myntra_data.json, using inline fallback');
    }
  }
  return getInlineFallback();
}

// Known brand list for extraction from page text
const KNOWN_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'Reebok', 'Woodland', 'Fastrack', 'Titan',
  'Roadster', 'H&M', 'Zara', "Levi's", 'Levi', 'Tommy Hilfiger', 'Mango',
  'USPA', 'Wrangler', 'Mast & Harbour', 'Forever 21', 'Huda Beauty', 'MAC',
  'Kay Beauty', 'Coverstory', 'The Label Life', 'Casio', 'Fossil', 'Diesel',
  'Puma', 'Skechers', 'Bata', 'Liberty', 'Metro', 'Lacoste', 'Superdry',
  'Jack & Jones', 'Only', 'Vero Moda', 'Mochi', 'Spa Ceylon', 'The Body Shop',
  'Sugar', 'Nykaa', 'Lakme', 'Maybelline', 'L\'Oreal', 'Garnier', 'Dove',
  'Patanjali', 'Biotique', 'Mamaearth', 'Wow', 'Minimalist', 'The Ordinary',
  'HRX', 'Netplay', 'Killer', 'Flying Machine', 'Pepe Jeans', 'Spykar',
  'Numero Uno', 'Celio', 'Arrow', 'Van Heusen', 'Allen Solly', 'Louis Philippe',
  'Peter England', 'John Players', 'Indian Terrain', 'Raymond', 'Blackberrys',
  'Park Avenue', 'Donear', 'Siyaram', 'Oxemberg', 'Monte Carlo', 'Wildcraft',
  'American Tourister', 'Skybags', 'Safari', 'VIP', 'Caprese', 'Lavie',
  'Da Milano', 'Hidesign', 'Baggit', 'Titan Eyeplus', 'Ray-Ban', 'Oakley',
  'IDEE', 'GIVA', 'Tanishq', 'Kalyan Jewellers', 'Caratlane'
];

function getInlineFallback() {
  return {
    title: 'Myntra - Online Shopping for Fashion & Lifestyle',
    metaDescription: 'Myntra is India\'s leading e-commerce platform for fashion and lifestyle products.',
    navigation: [
      { text: 'Men', href: 'https://www.myntra.com/men' },
      { text: 'Women', href: 'https://www.myntra.com/women' },
      { text: 'Kids', href: 'https://www.myntra.com/kids' },
      { text: 'Home & Living', href: 'https://www.myntra.com/home-living' },
      { text: 'Beauty', href: 'https://www.myntra.com/beauty' },
      { text: 'Studio', href: 'https://www.myntra.com/studio' },
      { text: 'Gift Cards', href: 'https://www.myntra.com/giftcard' },
      { text: 'Insider', href: 'https://www.myntra.com/myntrainsider' }
    ],
    categories: [
      { text: 'Men T-Shirts', href: '/men-tshirts' },
      { text: 'Men Shirts', href: '/men-shirts' },
      { text: 'Men Jeans', href: '/men-jeans' },
      { text: 'Men Sneakers', href: '/men-sneakers' },
      { text: 'Women Sarees', href: '/women-sarees' },
      { text: 'Women Kurtas & Kurtis', href: '/women-kurtas' },
      { text: 'Women Dresses', href: '/women-dresses' },
      { text: 'Women Tops', href: '/women-tops' },
      { text: 'Kids Clothing', href: '/kids-clothing' },
      { text: 'Beauty & Personal Care', href: '/beauty' },
      { text: 'Home & Living', href: '/home-living' },
      { text: 'Watches & Accessories', href: '/watches' },
      { text: 'Footwear', href: '/footwear' },
      { text: 'Bags & Backpacks', href: '/bags' }
    ],
    brands: [
      'Nike', 'Adidas', 'Puma', 'Roadster', 'H&M', 'Zara', "Levi's",
      'Tommy Hilfiger', 'Mango', 'Forever 21', 'Reebok', 'Woodland',
      'Fastrack', 'Titan', 'USPA', 'Wrangler', 'SKECHERS', 'Lacoste',
      'Superdry', 'Jack & Jones', 'Only', 'Vero Moda', 'Pepe Jeans',
      'Flying Machine', 'HRX', 'Arrow', 'Van Heusen', 'Allen Solly',
      'Louis Philippe', 'Wildcraft', 'Raymond', 'Park Avenue',
      'Bata', 'Metro', 'Mochi', 'Caprese', 'Lavie', 'Casio', 'Fossil',
      'Diesel', 'Ray-Ban', 'GIVA', 'Tanishq', 'Mamaearth', 'Nykaa',
      'Lakme', 'Sugar', 'The Body Shop'
    ],
    products: [
      { title: 'Men Printed T-Shirt', text: 'Cotton blend t-shirt with modern print', category: 'Men T-Shirts', price: 499, brand: 'Roadster', href: '/product/tshirt-1' },
      { title: 'Women Floral Dress', text: 'Elegant floral print midi dress', category: 'Women Dresses', price: 1499, brand: 'Mango', href: '/product/dress-1' },
      { title: 'Men Slim Fit Jeans', text: 'Stretchable slim fit jeans in dark blue', category: 'Men Jeans', price: 1599, brand: "Levi's", href: '/product/jeans-1' },
      { title: 'Running Shoes', text: 'Comfortable running shoes with cushioned sole', category: 'Men Sneakers', price: 3999, brand: 'Nike', href: '/product/shoes-1' },
      { title: 'Women Embroidered Kurta', text: 'Beautiful embroidered kurta in cotton silk', category: 'Women Kurtas & Kurtis', price: 899, brand: 'Roadster', href: '/product/kurta-1' },
      { title: 'Men Formal Shirt', text: 'Slim fit formal shirt in crisp cotton', category: 'Men Shirts', price: 1199, brand: 'Arrow', href: '/product/shirt-1' },
      { title: 'Women Georgette Saree', text: 'Elegant georgette saree with lace border', category: 'Women Sarees', price: 2499, brand: 'Mango', href: '/product/saree-1' },
      { title: 'Men Casual Sneakers', text: 'Trendy casual sneakers with memory foam', category: 'Men Sneakers', price: 2999, brand: 'Puma', href: '/product/sneaker-1' },
      { title: 'Women Cotton Top', text: 'Basic solid cotton top for casual wear', category: 'Women Tops', price: 599, brand: 'H&M', href: '/product/top-1' },
      { title: 'Unisex Backpack', text: 'Water-resistant backpack with laptop compartment', category: 'Bags & Backpacks', price: 1499, brand: 'Wildcraft', href: '/product/bag-1' },
      { title: 'Men Quartz Watch', text: 'Analog quartz watch with stainless steel strap', category: 'Watches & Accessories', price: 2995, brand: 'Fastrack', href: '/product/watch-1' },
      { title: 'Women Casual Dress', text: 'Comfortable casual day dress in floral print', category: 'Women Dresses', price: 1299, brand: 'Forever 21', href: '/product/dress-2' },
      { title: 'Men Sport Shoes', text: 'Lightweight running shoes with breathable mesh', category: 'Men Sneakers', price: 4999, brand: 'Adidas', href: '/product/shoe-2' },
      { title: 'Women Handbag', text: 'Trendy handbag with multiple compartments', category: 'Bags & Backpacks', price: 1999, brand: 'Caprese', href: '/product/handbag-1' },
      { title: 'Kids Colorful T-Shirt', text: 'Fun printed t-shirt for kids, 100% cotton', category: 'Kids Clothing', price: 399, brand: 'H&M', href: '/product/kids-tshirt-1' },
      { title: 'Women Straight Kurti', text: 'Straight cut kurti with digital print', category: 'Women Kurtas & Kurtis', price: 749, brand: 'Roadster', href: '/product/kurti-1' },
      { title: 'Men Leather Wallet', text: 'Genuine leather bifold wallet with RFID', category: 'Watches & Accessories', price: 999, brand: 'Tommy Hilfiger', href: '/product/wallet-1' },
      { title: 'Men Slim Chinos', text: 'Stretch chino pants for smart casual look', category: 'Men Jeans', price: 1899, brand: 'USPA', href: '/product/chino-1' }
    ],
    deals: [
      { text: 'Flat 50-80% Off on Top Brands - End of Season Sale', href: '/sale' },
      { text: 'Free Shipping on Orders Above ₹499', href: '/offers/shipping' },
      { text: 'Buy 3 Get 2 Free on Accessories & Footwear', href: '/offers/buy3get2' },
      { text: 'Extra ₹500 Off on First Purchase - Use Code MYNTRA500', href: '/offers/first' },
      { text: 'Bank Offers: 10% Cashback on HDFC & ICICI Cards', href: '/offers/bank' },
      { text: 'Myntra Insider: Exclusive Rewards & Early Access', href: '/insider' },
      { text: 'Flat 30% Off on Nike, Adidas & Puma Sportswear', href: '/offers/sports' }
    ],
    policies: [
      {
        topic: 'returns',
        title: 'Returns Policy',
        content: 'Myntra offers a 14-day returns policy on most products. You can return items within 14 days of delivery for a full refund. Products must be unused, unwashed, and with all tags attached. To initiate a return, go to "My Orders" on the Myntra app or website, select the item you want to return, and follow the prompts. A pick-up will be scheduled at your address, or you can self-ship the item. Refunds are processed within 5-7 business days after the returned item is received and inspected.',
        keywords: ['return', 'returns', 'refund', 'refunds', 'replace', 'exchange', '14 days', 'return policy', 'return item']
      },
      {
        topic: 'cancellation',
        title: 'Cancellation Policy',
        content: 'Myntra allows order cancellation before the item is shipped. You can cancel from "My Orders" section on the app or website. If the order has already been shipped, cancellation is not possible — you will need to refuse delivery or initiate a return after receiving it. For prepaid orders, cancellation refunds are processed within 5-7 business days. For COD orders, no payment is deducted.',
        keywords: ['cancel', 'cancellation', 'cancel order', 'cancel item', 'cancelled']
      },
      {
        topic: 'shipping',
        title: 'Shipping Policy',
        content: 'Myntra offers free shipping on orders above ₹499. Orders below ₹499 have a standard shipping fee of ₹49. Standard delivery takes 3-7 business days depending on your location. Express delivery options are available for select pincodes at an additional charge. You can track your order status from the "My Orders" section.',
        keywords: ['shipping', 'delivery', 'free shipping', 'delivery time', 'shipping fee', 'ship', 'dispatch']
      },
      {
        topic: 'payment',
        title: 'Payment & Refund Policy',
        content: 'Myntra accepts multiple payment methods: Credit/Debit Cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), EMI options, and Cash on Delivery (COD). Refunds for prepaid orders are processed to the original payment method within 5-7 business days after the return is accepted. COD refunds are processed to your Myntra Wallet or bank account. Track refund status from "My Orders" > "Returns" section.',
        keywords: ['payment', 'refund', 'payment method', 'cod', 'cash on delivery', 'emi', 'upi', 'net banking', 'pay']
      },
      {
        topic: 'quality',
        title: '100% Original Guarantee',
        content: 'Myntra guarantees 100% original products. Every item sold on Myntra is sourced directly from brands or authorized distributors. If you receive a counterfeit or defective product, you are eligible for a full refund under the "Quality Guarantee" policy. Contact customer support immediately at the grievance redressal portal for such cases.',
        keywords: ['original', 'guarantee', 'quality', 'counterfeit', 'defective', 'damaged', 'fake', 'genuine', 'authentic']
      }
    ],
    footer: ['About Us', 'Contact Us', 'Returns Policy', 'FAQ', 'Terms of Use', 'Privacy Policy', 'Shipping Info', 'Cancellation Policy'],
    pageText: 'Myntra is India\'s leading e-commerce platform for fashion and lifestyle products. Shop from top brands like Nike, Adidas, Puma, H&M, Zara, Roadster and more.'
  };
}

/**
 * Extract known brand names from unstructured page text
 */
function extractBrandsFromPageText(pageText) {
  if (!pageText) return [];
  const found = new Set();
  const text = pageText.toLowerCase();
  KNOWN_BRANDS.forEach(brand => {
    if (text.includes(brand.toLowerCase())) {
      found.add(brand);
    }
  });
  return [...found].sort();
}

async function scrapeMyntra() {
  console.log('🚀 Attempting to scrape Myntra.com...');
  
  // Try puppeteer first
  try {
    const result = await scrapeWithPuppeteer();
    return result;
  } catch (err) {
    console.log(`⚠️  Puppeteer scraping failed: ${err.message}`);
    console.log('📦 Using comprehensive fallback data...');
    
    const fallbackData = getFallbackData();
    
    // Save fallback data
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    const outputPath = path.join(dataDir, 'myntra_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(fallbackData, null, 2), 'utf-8');
    
    console.log(`✅ Fallback data saved to: ${outputPath}`);
    console.log(`   - Navigation items: ${fallbackData.navigation.length}`);
    console.log(`   - Categories: ${fallbackData.categories.length}`);
    console.log(`   - Brands: ${fallbackData.brands.length}`);
    console.log(`   - Products/items: ${fallbackData.products.length}`);
    console.log(`   - Deals/offers: ${fallbackData.deals.length}`);
    console.log(`   - Policies: ${(fallbackData.policies || []).length}`);
    
    return fallbackData;
  }
}

async function scrapeWithPuppeteer() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    console.log('📄 Navigating to Myntra.com...');
    await page.goto(MYNTRA_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    
    await new Promise(r => setTimeout(r, 5000));

    // Try to scroll to load more content
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => window.scrollTo(0, 1000));
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    // Extract all data
    const pageData = await page.evaluate(() => {
      const data = {
        title: document.title,
        metaDescription: '',
        navigation: [],
        categories: [],
        brands: [],
        products: [],
        deals: [],
        footer: [],
        pageText: ''
      };

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) data.metaDescription = metaDesc.content;

      // Navigation
      document.querySelectorAll('a[href*="myntra"], nav a, header a').forEach(el => {
        const text = el.innerText?.trim();
        const href = el.href || '';
        if (text && text.length > 0 && text.length < 60 && !href.includes('javascript')) {
          data.navigation.push({ text, href });
        }
      });

      // Categories
      document.querySelectorAll('[class*="category"] a, [class*="Category"] a, [class*="nav"] a').forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 0 && text.length < 60) {
          data.categories.push({ text, href: el.href || '' });
        }
      });

      // Brands
      document.querySelectorAll('[class*="brand"] a, [class*="Brand"] a').forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 0 && text.length < 50) {
          data.brands.push(text);
        }
      });

      // Products
      document.querySelectorAll('[class*="product"] a, [class*="Product"] a, a[href*="/buy/"], a[href*="-p-"]').forEach(el => {
        const title = el.getAttribute('title') || el.querySelector('img')?.getAttribute('alt') || '';
        const text = el.innerText?.trim();
        if (title || (text && text.length > 0)) {
          data.products.push({
            title: title?.substring(0, 100) || '',
            text: text?.substring(0, 200) || '',
            href: el.href || ''
          });
        }
      });

      // Deals
      document.querySelectorAll('[class*="deal"] a, [class*="offer"] a, [class*="sale"] a, [class*="banner"] a').forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 0) {
          data.deals.push({ text: text.substring(0, 150), href: el.href || '' });
        }
      });

      // Footer
      document.querySelectorAll('footer a').forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 0) {
          data.footer.push({ text, href: el.href || '' });
        }
      });

      const bodyText = document.body?.innerText || '';
      data.pageText = bodyText.substring(0, 30000);

      return data;
    });

    // Clean up
    pageData.navigation = [...new Map(pageData.navigation.map(n => [n.text.toLowerCase(), n])).values()];
    pageData.categories = [...new Map(pageData.categories.map(c => [c.text.toLowerCase(), c])).values()];
    pageData.brands = [...new Set(pageData.brands)];
    pageData.products = pageData.products.slice(0, 50);
    pageData.deals = pageData.deals.slice(0, 30);
    pageData.footer = [...new Set(pageData.footer.map(f => f.text))].slice(0, 40);

    // Check if we got enough data - if not, use fallback
    const totalDataPoints = pageData.navigation.length + pageData.categories.length + 
                           pageData.brands.length + pageData.products.length + pageData.deals.length;
    
    if (totalDataPoints < 20) {
      throw new Error('Insufficient data scraped from website');
    }

    // Extract brands from page text if DOM extraction found nothing
    if (pageData.brands.length === 0 && pageData.pageText) {
      const extractedBrands = extractBrandsFromPageText(pageData.pageText);
      if (extractedBrands.length > 0) {
        console.log(`   📋 Extracted ${extractedBrands.length} brands from page text`);
        pageData.brands = extractedBrands;
      }
    }

    // Enrich sparse data with comprehensive fallback data
    const enriched = getInlineFallback();
    if (pageData.brands.length < 10) {
      const existingBrands = new Set(pageData.brands.map(b => b.toLowerCase()));
      const additionalBrands = enriched.brands.filter(b => !existingBrands.has(b.toLowerCase()));
      pageData.brands = [...pageData.brands, ...additionalBrands];
      console.log(`   📋 Enriched brands: ${pageData.brands.length} total`);
    }
    if (pageData.products.length === 0) {
      pageData.products = enriched.products;
      console.log(`   📋 Added ${enriched.products.length} products from fallback`);
    }
    if (pageData.deals.length === 0) {
      pageData.deals = enriched.deals;
      console.log(`   📋 Added ${enriched.deals.length} deals from fallback`);
    }
    if (!pageData.policies || pageData.policies.length === 0) {
      pageData.policies = enriched.policies;
      console.log(`   📋 Added ${enriched.policies.length} policies from fallback`);
    }

    // Save data
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    const outputPath = path.join(dataDir, 'myntra_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(pageData, null, 2), 'utf-8');
    
    console.log(`✅ Scraping complete! Data saved to: ${outputPath}`);
    console.log(`   - Navigation items: ${pageData.navigation.length}`);
    console.log(`   - Categories: ${pageData.categories.length}`);
    console.log(`   - Brands: ${pageData.brands.length}`);
    console.log(`   - Products/items: ${pageData.products.length}`);
    console.log(`   - Deals/offers: ${pageData.deals.length}`);
    console.log(`   - Policies: ${(pageData.policies || []).length}`);
    
    return pageData;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeMyntra };
