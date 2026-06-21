# 🛍️ Myntra AI Assistant

An intelligent, full-stack AI chatbot that scrapes Myntra.com, builds a knowledge base using NLP (TF-IDF), and answers questions about products, brands, categories, deals, and policies — all with a polished Myntra-branded UI.

---

## Features

- **🤖 NLP Chatbot** — Context-aware TF-IDF engine with synonym expansion, follow-up detection, and price/category/brand filtering
- **📡 Web Scraper** — Puppeteer-based scraper with graceful fallback chain and page-text brand extraction
- **📄 PDF Report Generator** — Professional Myntra data report with cover page, table of contents, and styled sections
- **📋 Policy Support** — Answers questions about returns, cancellations, shipping, refunds, and product authenticity
- **🎨 Polished UI** — Myntra-branded (#FF3F6C) chat interface with sidebar stats, suggestion chips, and typing indicators
- **📱 Responsive** — Mobile-friendly with hamburger menu sidebar toggle
- **🛡️ Rate Limiting** — In-memory rate limiter (20 req/min) to prevent abuse
- **✅ Input Validation** — 500 character query limit

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 4.18 |
| Frontend | Vanilla HTML/CSS/JS |
| Scraping | Puppeteer 22 (headless Chrome) |
| NLP | Natural.js (TfIdf, tokenizer) |
| PDF | PDFKit 0.15 |
| Font | Google Fonts — Inter |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```

The server will:
1. Start on `http://localhost:3000` (auto-finds next available port if 3000 is busy)
2. Scrape Myntra.com for product/brand/deal data (falls back to rich built-in data if scraping fails)
3. Generate a PDF report (`myntra_data.pdf`)
4. Initialize the chatbot knowledge base

Open `http://localhost:3000` in your browser to start chatting.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server (scrape + PDF + chatbot init) |
| `npm run scrape` | Run scraper only (saves to `data/myntra_data.json`) |

---

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Ask a question. Body: `{ "query": "..." }` |
| `/api/stats` | GET | Get counts of brands, products, deals, categories, policies |
| `/api/status` | GET | Server readiness status + knowledge entry count |
| `/api/pdf` | GET | Download the generated `myntra_data.pdf` |

### Chat Example

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What brands are available on Myntra?"}'
```

---

## Example Queries

| Category | Query |
|----------|-------|
| Brands | "What brands are on Myntra?" |
| Products | "Show me men t-shirts under ₹1000" |
| Deals | "What deals are available?" |
| Categories | "What categories does Myntra have?" |
| Returns | "What is your return policy?" |
| Cancellation | "How do I cancel my order?" |
| Shipping | "What about shipping and delivery?" |
| Refund | "What is the refund policy?" |
| Quality | "Are products on Myntra genuine?" |
| Specific Brand | "Show me Nike products" |

---

## Project Structure

```
Project31_AICHATBOT/
├── server.js               # Express server + API routes
├── scraper.js              # Puppeteer scraper + fallback data
├── chatbot.js              # NLP chatbot engine (TF-IDF)
├── pdf-generator.js        # PDF report generator (PDFKit)
├── package.json
├── .gitignore
├── README.md
├── Prompt.md
├── data/
│   └── myntra_data.json    # Scraped/enriched Myntra data
└── public/
    ├── index.html          # Chat UI
    ├── style.css           # Styles (639 lines)
    └── script.js           # Frontend logic
```

---

## How It Works

1. **Scraping** — Puppeteer navigates to Myntra.com and extracts navigation, categories, products, brands, and deals from the DOM. If scraping fails or returns sparse data, a comprehensive inline fallback is used and enriched with brands extracted from page text.

2. **Knowledge Base** — The chatbot builds a knowledge base from all scraped data, chunking page text into 200-word overlapping segments. Each entry has auto-generated keywords for TF-IDF matching.

3. **NLP Engine** — Queries are processed through:
   - Greeting detection → friendly welcome message
   - Myntra relevance filter → fallback for non-Myntra questions
   - Context extraction → detects topic (deals/brands/categories/products/policy), category, brand, and price range
   - Follow-up resolution → merges with previous context for "more" or "tell me more"
   - Synonym expansion → "sneakers" → "shoes", "kurta" → "kurtis"
   - TF-IDF matching → finds most relevant knowledge entries
   - Direct keyword fallback → matches keywords if TF-IDF score is too low
   - Page text search → searches raw page text as last resort

4. **Rate Limiting** — In-memory store tracks requests per IP (20 requests per minute window). Stale entries are cleaned every 5 minutes.

---

## Customization

### Adding More Products
Edit the `getInlineFallback()` function in `scraper.js` — add entries to the `products` array with `title`, `text`, `category`, `price`, and `brand` fields.

### Adding More Policies
Edit the `policies` array in `getInlineFallback()` in `scraper.js`. Each policy needs `topic`, `title`, `content`, and `keywords`.

### Adding Synonyms
Edit the `this.synonyms` object in the `MyntraChatbot` constructor in `chatbot.js`.

---

## License

Built as a project for AI chatbot experimentation. Not affiliated with Myntra.
