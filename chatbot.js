const natural = require('natural');
const fs = require('fs');
const path = require('path');

class MyntraChatbot {
  constructor() {
    this.data = null;
    this.knowledgeBase = [];
    this.tfidf = new natural.TfIdf();
    this.initialized = false;
    this.threshold = 0.05;

    // Synonym expansion: maps common terms to their canonical forms
    this.synonyms = {
      'sneakers': 'shoes',
      'sneaker': 'shoes',
      'sport shoes': 'shoes',
      'running shoes': 'shoes',
      'footwear': 'shoes',
      'sandals': 'footwear',
      'slippers': 'footwear',
      'kurta': 'kurtas',
      'kurti': 'kurtas',
      'kurtis': 'kurtas',
      'watch': 'watches',
      'timepiece': 'watches',
      'bag': 'bags',
      'backpack': 'bags',
      'handbag': 'bags',
      't-shirt': 't-shirts',
      'tshirt': 't-shirts',
      'jeans': 'jeans',
      'denim': 'jeans',
      'jewellery': 'jewelry',
      'jewelry': 'jewellery',
      'lipstick': 'makeup',
      'cosmetics': 'beauty',
      'skin care': 'beauty',
      'hair care': 'beauty',
      'perfume': 'fragrance',
      'decor': 'home',
      'furniture': 'home',
      'men': 'men',
      'women': 'women',
      'kids': 'kids',
      'children': 'kids',
      'cellphone': 'mobile',
      'smartphone': 'mobile'
    };

    // Known brands for page text extraction
    this.knownBrands = [
      'Nike', 'Adidas', 'Puma', 'Reebok', 'Woodland', 'Fastrack', 'Titan',
      'Roadster', 'H&M', 'Zara', "Levi's", 'Levi', 'Tommy Hilfiger', 'Mango',
      'USPA', 'Wrangler', 'Mast & Harbour', 'Forever 21', 'SKECHERS', 'Lacoste',
      'Superdry', 'Jack & Jones', 'Only', 'Vero Moda', 'HRX', 'Arrow',
      'Van Heusen', 'Allen Solly', 'Louis Philippe', 'Wildcraft', 'Raymond',
      'Park Avenue', 'Bata', 'Metro', 'Mochi', 'Caprese', 'Lavie', 'Casio',
      'Fossil', 'Diesel', 'Ray-Ban', 'GIVA', 'Tanishq', 'Mamaearth', 'Nykaa',
      'Lakme', 'Sugar', 'The Body Shop', 'Pepe Jeans', 'Flying Machine',
      'Patanjali', 'Biotique', 'Minimalist', 'HRX by Hrithik Roshan'
    ];

    // Conversation memory
    this.conversationHistory = [];
    this.lastContext = null; // { topic, category, brand, product }

    this.greetingPatterns = [
      /\b(hi|hello|hey|greetings|sup|howdy|namaste)\b/i,
      /\b(good\s*(morning|afternoon|evening|day))\b/i,
      /\b(what'?s\s*up|how'?s\s*it\s*going)\b/i
    ];

    this.fallbackResponses = [
      "I can only provide information about Myntra.com. Please ask me about products, categories, brands, deals, or shopping on Myntra.",
      "That's outside my knowledge scope. I'm specialized in Myntra website information — products, brands, categories, and offers.",
      "I don't have information about that. Try asking me about Myntra's product categories, available brands, or current deals!",
      "Sorry, I can only answer questions related to Myntra.com. Feel free to ask about what Myntra offers!"
    ];
  }

  initialize(data) {
    if (data) {
      this.data = data;
    } else {
      const dataPath = path.join(__dirname, 'data', 'myntra_data.json');
      if (fs.existsSync(dataPath)) {
        this.data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      } else {
        throw new Error('No data provided and no data file found. Run scraper first.');
      }
    }
    this.buildKnowledgeBase();
    this.buildTFIDF();
    this.initialized = true;
    console.log(`✅ Chatbot initialized with ${this.knowledgeBase.length} knowledge entries`);
    return this;
  }

  buildKnowledgeBase() {
    const kb = [];

    if (this.data.title) {
      kb.push({ type: 'info', content: `Myntra website: ${this.data.title}`, keywords: ['myntra', 'website', 'online', 'shopping'] });
    }
    if (this.data.metaDescription) {
      kb.push({ type: 'info', content: `About Myntra: ${this.data.metaDescription}`, keywords: ['myntra', 'about', 'description'] });
    }

    if (this.data.navigation) {
      this.data.navigation.forEach(item => {
        const words = item.text.toLowerCase().split(/[\s/]+/).filter(w => w.length > 1);
        kb.push({ type: 'navigation', content: `Myntra's ${item.text} section - ${item.href}`, keywords: [...words, item.text.toLowerCase()] });
      });
    }

    if (this.data.categories) {
      this.data.categories.forEach(item => {
        const words = item.text.toLowerCase().split(/[\s/]+/).filter(w => w.length > 1);
        kb.push({ type: 'category', content: `Category: ${item.text} - ${item.href}`, keywords: [...words, 'category', item.text.toLowerCase()] });
      });
    }

    if (this.data.brands) {
      this.data.brands.forEach(brand => {
        kb.push({ type: 'brands', content: `Brand available on Myntra: ${brand}`, keywords: [brand.toLowerCase(), 'brand', 'myntra'] });
      });
      kb.push({
        type: 'brands', content: `Myntra offers brands like: ${this.data.brands.join(', ')}`,
        keywords: ['brands', 'myntra', ...this.data.brands.map(b => b.toLowerCase())]
      });
    }

    if (this.data.products) {
      this.data.products.forEach(product => {
        const text = product.title || '';
        const words = text.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
        const kw = [...words, 'product', 'myntra', (product.brand || '').toLowerCase()];
        if (product.category) kw.push(product.category.toLowerCase());
        kb.push({ type: 'product', content: `Product on Myntra: ${text}`, keywords: kw, meta: product });
      });
    }

    if (this.data.deals) {
      this.data.deals.forEach(deal => {
        const words = deal.text.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
        kb.push({ type: 'deals', content: `Myntra deal: ${deal.text}`, keywords: [...words, 'deal', 'offer', 'discount', 'sale'] });
      });
    }

    // Add policy knowledge entries
    if (this.data.policies) {
      this.data.policies.forEach(policy => {
        kb.push({
          type: 'policy',
          content: `**${policy.title}**: ${policy.content}`,
          keywords: policy.keywords
        });
        // Add a shorter version for quick matching
        kb.push({
          type: 'policy',
          content: `${policy.title}: ${policy.content.split('.')[0]}.`,
          keywords: policy.keywords.slice(0, 5)
        });
      });
    }

    if (this.data.footer) {
      this.data.footer.forEach(link => {
        kb.push({ type: 'footer', content: `Myntra information: ${link}`, keywords: [link.toLowerCase(), 'myntra'] });
      });
    }

    // Extract brands from page text if structured brands are empty
    if ((!this.data.brands || this.data.brands.length === 0) && this.data.pageText) {
      this.data.brands = this.extractBrandsFromPageText(this.data.pageText);
    }

    // Add extracted product types as knowledge
    if (this.data.pageText) {
      const productTypes = this.extractProductsFromPageText(this.data.pageText);
      if (productTypes.length > 0) {
        kb.push({
          type: 'products',
          content: `Myntra offers a wide range of products including: ${productTypes.join(', ')}.`,
          keywords: ['products', 'myntra', 'online', 'shopping', 'fashion', ...productTypes.map(p => p.replace(/s$/, ''))]
        });
        // Group them for better matching
        const categories = ['clothing', 'footwear', 'accessories', 'beauty', 'home'];
        categories.forEach(cat => {
          const matchingTypes = productTypes.filter(pt => {
            if (cat === 'clothing') return ['t-shirt', 'shirt', 'jeans', 'saree', 'kurta', 'dress', 'top', 'lehenga', 'gown', 'blazer', 'jacket', 'suit', 'trouser', 'shorts', 'skirt', 'palazzo', 'sweater', 'hoodie', 'innerwear'].some(t => pt.includes(t));
            if (cat === 'footwear') return ['shoe', 'sandal', 'sneaker', 'loafer', 'boot', 'heel', 'flip-flop'].some(t => pt.includes(t));
            if (cat === 'accessories') return ['watch', 'bag', 'wallet', 'belt', 'sunglasses', 'jewellery', 'earring', 'necklace', 'bracelet'].some(t => pt.includes(t));
            if (cat === 'beauty') return ['makeup', 'lipstick', 'shampoo', 'cream', 'lotion', 'perfume'].some(t => pt.includes(t));
            if (cat === 'home') return ['bedsheet', 'curtain', 'cushion', 'pillow', 'lamp', 'clock', 'vase', 'decor'].some(t => pt.includes(t));
            return false;
          });
          if (matchingTypes.length > 0) {
            kb.push({
              type: 'category',
              content: `Myntra's ${cat} section includes: ${matchingTypes.join(', ')}.`,
              keywords: [cat, ...matchingTypes.map(p => p.replace(/s$/, ''))]
            });
          }
        });
      }
    }

    if (this.data.pageText) {
      const chunks = this.chunkText(this.data.pageText, 200);
      chunks.forEach(chunk => {
        const words = chunk.toLowerCase().split(/[\s,.;!?]+/).filter(w => w.length > 3);
        kb.push({ type: 'content', content: chunk, keywords: [...new Set(words.slice(0, 30))] });
      });
    }

    this.knowledgeBase = kb;
  }

  chunkText(text, maxWords) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += Math.floor(maxWords / 2)) {
      const chunk = words.slice(i, i + maxWords).join(' ');
      if (chunk.split(/\s+/).length >= 5) chunks.push(chunk);
    }
    return chunks;
  }

  /**
   * Expand query with synonyms for broader matching
   */
  expandSynonyms(query) {
    const q = query.toLowerCase();
    const expanded = [q];
    for (const [word, canonical] of Object.entries(this.synonyms)) {
      if (q.includes(word.toLowerCase()) && !q.includes(canonical)) {
        expanded.push(q.replace(word.toLowerCase(), canonical));
      }
    }
    return expanded;
  }

  /**
   * Extract known brand names from unstructured page text
   */
  extractBrandsFromPageText(pageText) {
    if (!pageText) return [];
    const found = new Set();
    const text = pageText.toLowerCase();
    this.knownBrands.forEach(brand => {
      if (text.includes(brand.toLowerCase())) {
        found.add(brand);
      }
    });
    return [...found].sort();
  }

  /**
   * Extract product types/categories from page text
   */
  extractProductsFromPageText(pageText) {
    if (!pageText) return [];
    const productTypes = [
      't-shirt', 't-shirts', 'shirt', 'shirts', 'jeans', 'saree', 'sarees',
      'kurta', 'kurtas', 'kurti', 'kurtis', 'dress', 'dresses', 'top', 'tops',
      'lehenga', 'gown', 'gowns', 'sneakers', 'shoes', 'sandals', 'flip-flops',
      'watch', 'watches', 'bag', 'bags', 'backpack', 'backpacks', 'wallet', 'wallets',
      'jewellery', 'jewelry', 'earrings', 'necklace', 'bracelet', 'ring', 'rings',
      'belt', 'belts', 'sunglasses', 'perfume', 'perfumes', 'footwear',
      'blazer', 'blazers', 'jacket', 'jackets', 'suit', 'suits', 'trouser', 'trousers',
      'shorts', 'skirt', 'skirts', 'palazzo', 'palazzos', 'dupatta', 'stole',
      'sweater', 'sweaters', 'hoodie', 'hoodies', 'innerwear', 'lingerie',
      'bra', 'bras', 'trunk', 'trunks', 'boxer', 'boxers', 'socks', 'tie', 'ties',
      'sport shoe', 'sport shoes', 'loafer', 'loafers', 'boots', 'heels', 'pumps',
      'makeup', 'lipstick', 'foundation', 'eyeliner', 'mascara', 'kajal',
      'soap', 'shampoo', 'cream', 'lotion', 'moisturizer', 'serum', 'sunscreen',
      'mask', 'facial', 'towel', 'bedsheet', 'curtain', 'cushion', 'pillow',
      'lamp', 'clock', 'frame', 'photo frame', 'vase', 'decor', 'artificial plant'
    ];
    const found = new Set();
    const text = pageText.toLowerCase();
    productTypes.forEach(pt => {
      if (text.includes(pt.toLowerCase())) {
        found.add(pt);
      }
    });
    return [...found].sort();
  }

  buildTFIDF() {
    this.knowledgeBase.forEach(entry => {
      const doc = [entry.content, ...(entry.keywords || []), entry.type].join(' ');
      this.tfidf.addDocument((doc + ' ' + (entry.keywords || []).join(' ').repeat(3)).toLowerCase());
    });
  }

  /**
   * Expand query with synonyms for broader matching, then check
   */
  isGreeting(query) {
    return this.greetingPatterns.some(pattern => pattern.test(query.trim()));
  }

  isMyntraRelated(query) {
    const terms = [
      'myntra', 'shopping', 'fashion', 'cloth', 'wear', 'apparel',
      'brand', 'product', 'category', 'deal', 'offer', 'discount',
      'sale', 'price', 'buy', 'shop', 'trend', 'collection',
      'men', 'women', 'kids', 'ethnic', 'western', 'traditional',
      'shirt', 't-shirt', 'jean', 'kurta', 'saree', 'dress',
      'shoe', 'accessor', 'bag', 'watch', 'jewelry', 'jewellery',
      'beauty', 'cosmetic', 'skin', 'hair', 'perfume',
      'home', 'living', 'furniture', 'decor', 'lighting',
      'return', 'policy', 'shipping', 'delivery', 'payment', 'cancel', 'refund',
      'exchange', 'guarantee', 'genuine', 'original', 'warranty',
      'coupon', 'promo', 'size', 'fit', 'material', 'fabric',
      'top', 'bottom', 'footwear', 'sandal', 'sneaker',
      'sport', 'activewear', 'gym', 'yoga', 'winter', 'summer',
      'festive', 'casual', 'formal', 'party', 'wedding',
      'more', 'show', 'tell', 'available', 'price', 'cost', 'rupees'
    ];
    return terms.some(term => query.toLowerCase().includes(term));
  }

  getFallbackResponse() {
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }

  getGreetingResponse() {
    const greetings = [
      "👋 Hello! Welcome to Myntra Assistant. I can help you find products, brands, categories, and deals on Myntra. What would you like to know?",
      "Hey there! 👋 I'm your Myntra shopping assistant. Ask me about products, brands, categories, or current offers on Myntra.com!",
      "Hi! Welcome to Myntra AI Assistant. I have detailed information about Myntra's products, categories, brands, and deals. How can I help you today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Extract context from query to determine what the user is looking for
   */
  extractContext(query) {
    const q = query.toLowerCase();
    const context = {};

    // Check for follow-up indicators (conservative — only clear continuation phrases)
    const followUpWords = ['more', 'else', 'other', 'another', 'those', 'these'];
    context.isFollowUp = followUpWords.some(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'i');
      return regex.test(q);
    }) && !/(?:what|which|show|tell|list|give)\s+(?:are|me|us|the|some|about)/i.test(q);

    // Detect category mentions
    if (this.data && this.data.categories) {
      const matched = this.data.categories.find(c => q.includes(c.text.toLowerCase()));
      if (matched) context.category = matched.text;
    }

    // Detect brand mentions
    if (this.data && this.data.brands) {
      const matched = this.data.brands.find(b => q.includes(b.toLowerCase()));
      if (matched) context.brand = matched;
    }

    // Detect price mentions
    const priceMatch = q.match(/(?:under|below|less\s*than|upto)\s*(?:rs\.?\s*)?(\d+)/i);
    if (priceMatch) context.maxPrice = parseInt(priceMatch[1], 10);
    const minPriceMatch = q.match(/(?:above|over|more\s*than|from)\s*(?:rs\.?\s*)?(\d+)/i);
    if (minPriceMatch) context.minPrice = parseInt(minPriceMatch[1], 10);

    // Detect deal/product interest
    if (q.includes('deal') || q.includes('offer') || q.includes('discount') || q.includes('sale')) context.topic = 'deals';
    else if (q.includes('brand')) context.topic = 'brands';
    else if (q.includes('category') || q.includes('section')) context.topic = 'categories';
    else if (q.includes('product') || q.includes('item') || q.includes('cloth') || q.includes('wear')) context.topic = 'products';

    // Detect policy interest
    const policyWords = ['return', 'refund', 'cancel', 'cancellation', 'shipping', 'delivery', 'policy', 'exchange', 'replace', 'replacement', 'guarantee', 'warranty', 'original', 'defective', 'damaged', 'payment', 'quality', 'genuine', 'authentic', 'counterfeit', 'fake'];
    if (policyWords.some(w => q.includes(w))) {
      context.topic = 'policy';
      // Determine specific policy type
      if (q.includes('return') || q.includes('exchange') || q.includes('replace')) context.policyType = 'returns';
      else if (q.includes('cancel') || q.includes('cancellation')) context.policyType = 'cancellation';
      else if (q.includes('shipping') || q.includes('delivery')) context.policyType = 'shipping';
      else if (q.includes('payment') || q.includes('cod') || q.includes('emi') || q.includes('refund')) context.policyType = 'payment';
      else if (q.includes('original') || q.includes('guarantee') || q.includes('counterfeit') || q.includes('defective') || q.includes('damaged') || q.includes('quality')) context.policyType = 'quality';
    }

    return context;
  }

  /**
   * Filter products by context (category, brand, price range)
   */
  filterProducts(context) {
    const products = this.data?.products || [];
    let filtered = [...products];

    if (context.category) {
      const catLower = context.category.toLowerCase();
      filtered = filtered.filter(p => {
        const prodCat = (p.category || p.text || '').toLowerCase();
        return prodCat.includes(catLower) || (p.title || '').toLowerCase().includes(catLower);
      });
    }

    if (context.brand) {
      const brandLower = context.brand.toLowerCase();
      filtered = filtered.filter(p => (p.brand || '').toLowerCase().includes(brandLower));
    }

    if (context.minPrice) {
      filtered = filtered.filter(p => (p.price || 0) >= context.minPrice);
    }
    if (context.maxPrice) {
      filtered = filtered.filter(p => (p.price || 0) <= context.maxPrice);
    }

    return filtered;
  }

  /**
   * Check if a follow-up needs the previous context
   */
  resolveFollowUp(query) {
    const q = query.toLowerCase();
    const followUp = this.lastContext;

    // Short queries or "more/else" — merge with last context
    const isVague = q.length < 12 || /\b(more|else|other|those|them|it|these)\b/.test(q);
    if (isVague && followUp) {
      return followUp;
    }
    return null;
  }

  ask(query) {
    if (!this.initialized) {
      return "I'm not initialized yet. Please wait for the data to load.";
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return "Please ask me a question about Myntra!";

    // Handle greetings
    if (this.isGreeting(trimmedQuery) && !this.isMyntraRelated(trimmedQuery)) {
      return this.getGreetingResponse();
    }

    // Check Myntra relevance
    if (!this.isMyntraRelated(trimmedQuery)) {
      return this.getFallbackResponse();
    }

    // Extract context from current query
    const context = this.extractContext(trimmedQuery);

    // If it's a follow-up, merge with last context (but only if topics don't conflict)
    if (context.isFollowUp && this.lastContext) {
      const merged = { ...this.lastContext };
      // Don't override a new, explicit topic from the current query
      if (!context.topic) context.topic = merged.topic;
      if (!context.category) context.category = merged.category;
      if (!context.brand) context.brand = merged.brand;
      if (!context.minPrice && !context.maxPrice) {
        context.minPrice = merged.minPrice;
        context.maxPrice = merged.maxPrice;
      }
    }

    // If query is very vague (e.g., "show me more", "tell me"), use last context
    const resolvedContext = this.resolveFollowUp(trimmedQuery);
    if (resolvedContext) {
      const merged = { ...resolvedContext };
      if (!context.topic) context.topic = merged.topic;
      if (!context.category) context.category = merged.category;
      if (!context.brand) context.brand = merged.brand;
    }

    // === Context-Aware Response Generation ===

    // If we have a specific category, brand, or price filter — show filtered products
    if (context.category || context.brand || context.minPrice || context.maxPrice) {
      const filtered = this.filterProducts(context);
      if (filtered.length > 0) {
        this.lastContext = context;
        this.conversationHistory.push({ role: 'user', query: trimmedQuery });
        const response = this.formatFilteredProducts(filtered, context);
        this.conversationHistory.push({ role: 'assistant', response });
        return response;
      }
    }

    // If topic is deals
    if (context.topic === 'deals') {
      this.lastContext = { topic: 'deals' };
      this.conversationHistory.push({ role: 'user', query: trimmedQuery });
      const response = this.formatDeals();
      this.conversationHistory.push({ role: 'assistant', response });
      return response;
    }

    // If topic is brands
    if (context.topic === 'brands' && !context.brand) {
      this.lastContext = { topic: 'brands' };
      this.conversationHistory.push({ role: 'user', query: trimmedQuery });
      const response = this.formatBrands();
      this.conversationHistory.push({ role: 'assistant', response });
      return response;
    }

    // If topic is categories
    if (context.topic === 'categories') {
      this.lastContext = { topic: 'categories' };
      this.conversationHistory.push({ role: 'user', query: trimmedQuery });
      const response = this.formatCategories();
      this.conversationHistory.push({ role: 'assistant', response });
      return response;
    }

    // If topic is policy (return, refund, cancellation, shipping, etc.)
    if (context.topic === 'policy') {
      this.lastContext = { topic: 'policy', policyType: context.policyType };
      this.conversationHistory.push({ role: 'user', query: trimmedQuery });
      const response = this.formatPolicy(context.policyType);
      this.conversationHistory.push({ role: 'assistant', response });
      return response;
    }

    // === Synonym-expanded TF-IDF matching ===
    const expandedQueries = this.expandSynonyms(trimmedQuery);
    const scoreMap = new Map();

    expandedQueries.forEach(eq => {
      const scores = [];
      this.tfidf.tfidfs(eq.toLowerCase(), (i, measure) => {
        scores.push({ index: i, score: measure });
      });
      scores.forEach(s => {
        scoreMap.set(s.index, (scoreMap.get(s.index) || 0) + s.score);
      });
    });

    const aggregated = [...scoreMap.entries()].map(([index, score]) => ({ index, score }));
    aggregated.sort((a, b) => b.score - a.score);

    const relevantEntries = aggregated.filter(s => s.score > this.threshold).slice(0, 5);

    if (relevantEntries.length === 0) {
      // Direct keyword match fallback
      const directMatch = this.knowledgeBase.filter(entry =>
        (entry.keywords || []).some(kw => trimmedQuery.toLowerCase().includes(kw.toLowerCase()))
      );
      if (directMatch.length > 0) {
        this.lastContext = context;
        this.conversationHistory.push({ role: 'user', query: trimmedQuery });
        const response = this.formatResponse(directMatch.slice(0, 3), trimmedQuery);
        this.conversationHistory.push({ role: 'assistant', response });
        return response;
      }

      // Page text search
      if (this.data?.pageText) {
        const queryTerms = trimmedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const textLower = this.data.pageText.toLowerCase();
        const matchedTerms = queryTerms.filter(term => textLower.includes(term));
        if (matchedTerms.length >= 2) {
          const sentences = this.data.pageText.split(/[.!?\n]+/);
          const relevantSentences = sentences.filter(s => matchedTerms.some(t => s.toLowerCase().includes(t)));
          if (relevantSentences.length > 0) {
            this.lastContext = context;
            this.conversationHistory.push({ role: 'user', query: trimmedQuery });
            const response = this.formatRawResponse(relevantSentences.slice(0, 3), trimmedQuery);
            this.conversationHistory.push({ role: 'assistant', response });
            return response;
          }
        }
      }

      return this.getFallbackResponse();
    }

    const topEntries = relevantEntries.map(e => this.knowledgeBase[e.index]);
    this.lastContext = context;
    this.conversationHistory.push({ role: 'user', query: trimmedQuery });
    const response = this.formatResponse(topEntries, trimmedQuery);
    this.conversationHistory.push({ role: 'assistant', response });

    // Keep only last 10 exchanges
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    return response;
  }

  /**
   * Format filtered products with prices, brands, and categories
   */
  formatFilteredProducts(products, context) {
    let header = '';
    if (context.category) header = `**Products in ${context.category} on Myntra:**\n`;
    else if (context.brand) header = `**${context.brand} products on Myntra:**\n`;
    else if (context.minPrice || context.maxPrice) header = '**Products in your price range on Myntra:**\n';
    else header = '**Products I found on Myntra:**\n';

    const items = products.slice(0, 12).map(p => {
      let line = `• **${p.title}**`;
      if (p.price) line += ` — ₹${p.price}`;
      if (p.brand) line += `  | ${p.brand}`;
      if (p.text) line += `\n  _${p.text.substring(0, 80)}_`;
      return line;
    }).join('\n');

    let footer = '';
    if (products.length > 12) {
      footer = `\n\n_Showing 12 of ${products.length} products. Ask me to filter by brand or price!_`;
    }

    return `${header}\n${items}${footer}\n\n---\n*For more details, visit [Myntra.com](https://www.myntra.com/)*`;
  }

  formatDeals() {
    const deals = this.data?.deals || [];
    if (deals.length === 0) return "No deals available at the moment.";

    let response = "**🔥 Current Deals & Offers on Myntra:**\n\n";
    deals.forEach((d, i) => {
      const emoji = d.text.toLowerCase().includes('free') ? '🎁' :
                    d.text.toLowerCase().includes('off') ? '💰' :
                    d.text.toLowerCase().includes('bank') ? '🏦' : '🏷️';
      response += `${emoji} **${d.text}**\n`;
    });
    response += '\n\n---\n*For more details, visit [Myntra.com](https://www.myntra.com/)*';
    return response;
  }

  formatBrands() {
    const brands = this.data?.brands || [];
    if (brands.length === 0) return "No brand information available.";

    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < brands.length; i += chunkSize) {
      chunks.push(brands.slice(i, i + chunkSize).join(', '));
    }

    return `**Brands available on Myntra (${brands.length}+):**\n\n` +
      chunks.map(chunk => `• ${chunk}`).join('\n') +
      '\n\n_Ask me about products from a specific brand!_';
  }

  formatCategories() {
    const categories = this.data?.categories || [];
    if (categories.length === 0) return "No category information available.";

    const grouped = {};
    categories.forEach(c => {
      const parent = c.parent || 'Other';
      if (!grouped[parent]) grouped[parent] = [];
      grouped[parent].push(c.text);
    });

    let response = "**Categories on Myntra:**\n\n";
    Object.entries(grouped).forEach(([parent, items]) => {
      response += `**${parent}**\n`;
      response += items.map(i => `  • ${i}`).join('\n') + '\n';
    });
    response += '\n_Ask me about products in any category!_';
    return response;
  }

  /**
   * Format policy/return/refund/cancellation responses
   */
  formatPolicy(policyType) {
    const policies = this.data?.policies || [];
    if (policies.length === 0) {
      return "Myntra has a standard 14-day return policy and easy cancellation. For detailed policy information, visit [Myntra.com](https://www.myntra.com/contactus).";
    }

    // If a specific policy type is requested, show that one
    if (policyType) {
      const matched = policies.find(p => p.topic === policyType);
      if (matched) {
        return `**${matched.title}**\n\n${matched.content}\n\n---\n*For more details, visit [Myntra.com](https://www.myntra.com/contactus)*`;
      }
    }

    // Show all policies as a summary
    let response = "**Myntra Policies & Customer Support**\n\n";
    policies.forEach((p, i) => {
      response += `**${i + 1}. ${p.title}**\n${p.content.split('.')[0]}.\n\n`;
    });
    response += '---\n*For more details, visit [Myntra.com](https://www.myntra.com/contactus)*';
    return response;
  }

  formatResponse(entries, query) {
    const queryLower = query.toLowerCase();

    // Sort by relevance to query
    entries.sort((a, b) => {
      const aScore = (a.keywords || []).filter(k => queryLower.includes(k)).length;
      const bScore = (b.keywords || []).filter(k => queryLower.includes(k)).length;
      return bScore - aScore;
    });

    const seen = new Set();
    const uniqueContent = entries
      .map(e => e.content)
      .filter(c => {
        const key = c.toLowerCase().substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);

    if (uniqueContent.length === 0) return this.getFallbackResponse();
    const response = `Based on Myntra's website:\n\n${uniqueContent.map(c => `• ${c}`).join('\n')}`;
    return response + '\n\n---\n*For more details, visit [Myntra.com](https://www.myntra.com/)*';
  }

  formatRawResponse(sentences, query) {
    return `Based on Myntra's website content:\n\n${sentences.map(s => `• ${s.trim()}`).join('\n')}\n\n---\n*For more details, visit [Myntra.com](https://www.myntra.com/)*`;
  }

  getStats() {
    return {
      initialized: this.initialized,
      knowledgeEntries: this.knowledgeBase.length,
      brands: this.data?.brands?.length || 0,
      categories: this.data?.categories?.length || 0,
      products: this.data?.products?.length || 0,
      deals: this.data?.deals?.length || 0,
      policies: this.data?.policies?.length || 0,
      conversationHistory: this.conversationHistory.length,
      navigationLinks: this.data?.navigation?.length || 0
    };
  }
}

module.exports = MyntraChatbot;
