const express = require('express');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { scrapeMyntra } = require('./scraper');
const { generatePDF } = require('./pdf-generator');
const MyntraChatbot = require('./chatbot');

const app = express();
const DESIRED_PORT = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Rate Limiter (in-memory) =====
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  const timestamps = rateLimitStore.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);

  if (timestamps.length > RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      response: 'Too many requests. Please wait a moment and try again.'
    });
  }
  next();
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const fresh = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (fresh.length === 0) rateLimitStore.delete(ip);
    else rateLimitStore.set(ip, fresh);
  }
}, 5 * 60 * 1000);

// Store chatbot instance
let chatbot = null;
let isReady = false;
let PORT = DESIRED_PORT;

// ===== Port Finder =====
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, '0.0.0.0', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// ===== Initialize Application =====
async function initialize() {
  console.log('='.repeat(50));
  console.log('🛍️  Myntra AI Assistant - Initializing...');
  console.log('='.repeat(50));

  try {
    // Step 1: Scrape Myntra
    console.log('\n📡 Step 1: Scraping Myntra.com...');
    const myntraData = await scrapeMyntra();
    console.log('✅ Scraping completed successfully!');

    // Step 2: Generate PDF
    console.log('\n📄 Step 2: Generating PDF...');
    const pdfPath = await generatePDF(myntraData);
    console.log(`✅ PDF saved at: ${pdfPath}`);

    // Step 3: Initialize Chatbot
    console.log('\n🤖 Step 3: Initializing Chatbot...');
    chatbot = new MyntraChatbot();
    chatbot.initialize(myntraData);
    
    isReady = true;
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Myntra AI Assistant is READY!`);
    console.log(`   🌐 http://localhost:${PORT}`);
    console.log(`   📄 PDF: ${pdfPath}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    console.log('⚠️  Starting in limited mode...');
    
    // Try to load existing data if available
    try {
      const dataPath = path.join(__dirname, 'data', 'myntra_data.json');
      if (fs.existsSync(dataPath)) {
        console.log('📂 Loading existing data...');
        const myntraData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        chatbot = new MyntraChatbot();
        chatbot.initialize(myntraData);
        isReady = true;
        console.log('✅ Loaded from existing data');
      }
    } catch (e) {
      console.error('❌ Could not load existing data:', e.message);
    }
  }
}

// ===== API Routes =====

// Chat endpoint
app.post('/api/chat', rateLimiter, (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.json({
      success: false,
      response: 'Please enter a question!'
    });
  }

  if (query.trim().length > 500) {
    return res.json({
      success: false,
      response: 'Your question is too long. Please ask a shorter question (max 500 characters).'
    });
  }

  if (!isReady || !chatbot) {
    return res.json({
      success: true,
      response: '⏳ Myntra AI is still initializing. Please wait a moment and try again.'
    });
  }

  try {
    const response = chatbot.ask(query);
    res.json({
      success: true,
      response: response
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      success: false,
      response: 'Sorry, something went wrong processing your question.'
    });
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  if (chatbot && isReady) {
    const stats = chatbot.getStats();
    res.json({ success: true, stats });
  } else {
    res.json({
      success: true,
      stats: {
        products: 0,
        brands: 0,
        categories: 0,
        deals: 0,
        initialized: false
      }
    });
  }
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    ready: isReady,
    initialized: chatbot?.initialized || false,
    knowledgeEntries: chatbot?.knowledgeBase?.length || 0,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Download PDF endpoint
app.get('/api/pdf', (req, res) => {
  const pdfPath = path.join(__dirname, 'myntra_data.pdf');
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath, 'myntra_data.pdf');
  } else {
    res.status(404).json({ success: false, message: 'PDF not found. Run the scraper first.' });
  }
});

// ===== Start Server =====
async function startServer() {
  PORT = await findAvailablePort(DESIRED_PORT);
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Server starting on http://localhost:${PORT}`);
    if (PORT !== DESIRED_PORT) {
      console.log(`⚠️  Port ${DESIRED_PORT} was in use, using port ${PORT} instead`);
    }
    console.log('📡 Initializing data (this may take a moment)...\n');
  });
}

startServer().then(() => {
  // Initialize after server starts
  initialize().catch(console.error);
});

module.exports = app;
