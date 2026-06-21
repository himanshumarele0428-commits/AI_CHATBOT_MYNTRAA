# Prompt History — Myntra AI Assistant

I want you to create a AI Chat bot for the Website https://www.myntra.com/ where user can ask any query related to website and user can answer the question and its should be able to answer out site the Website 

This document records all major prompts used to build this project from scratch. Each entry captures the user's intent, the AI response summary, and the key files created or modified.

---

## Phase 1 — Project Scaffolding

### Prompt 1.1 — Initialize Project

**User:**
> Create a Node.js project called "myntra-ai-chatbot" for a Myntra AI shopping assistant. Set up the package.json with express, puppeteer, pdfkit, cors, and natural as dependencies. Create the basic folder structure with server.js as entry point and a public/ folder for frontend assets.

**AI Response Summary:**
- Created `package.json` with all dependencies
- Created `server.js` with Express boilerplate (JSON middleware, static file serving, port 3000)
- Created `public/index.html`, `public/style.css`, `public/script.js` with basic skeleton
- Created `data/` directory for scraped data

**Files Created:**
- `package.json`
- `server.js`
- `public/index.html`
- `public/style.css`
- `public/script.js`

---

## Phase 2 — Web Scraper

### Prompt 2.1 — Puppeteer Scraper

**User:**
> Build a web scraper using Puppeteer that scrapes Myntra.com. It should extract navigation links, categories, brands, products, deals/offers, footer links, and page text. Include a fallback mechanism that uses local JSON data if Puppeteer fails. Save the output to data/myntra_data.json.

**AI Response Summary:**
- Created `scraper.js` with `scrapeMyntra()` and `scrapeWithPuppeteer()` functions
- Implemented DOM selectors for navigation, categories, brands, products, deals, and footer
- Added deduplication and data quality checks (minimum 20 data points)
- Created `getFallbackData()` and `getInlineFallback()` chains
- Added Puppeteer configuration (headless, realistic UA, viewport, scrolling)

**Files Created:**
- `scraper.js`
- `data/myntra_data.json` (auto-generated)

### Prompt 2.2 — Scraper Fallback Enrichment

**User:**
> The Puppeteer scraper isn't extracting brands, products, or deals from Myntra's modern DOM. The arrays are empty. Enrich the fallback data with comprehensive product listings including prices, categories, and brands. Also extract brand names from the page text using a known brand list.

**AI Response Summary:**
- Replaced minimal inline fallback with 50+ brands, 18 products (with prices/categories/brands), 7 deals
- Added `extractBrandsFromPageText()` helper using 80+ known brand names
- Updated scrape enrichment to merge fallback data when scraped data is sparse

**Files Modified:**
- `scraper.js`

---

## Phase 3 — Chatbot NLP Engine

### Prompt 3.1 — Core NLP Engine

**User:**
> Build a chatbot class that uses Natural.js TF-IDF for question answering. It should build a knowledge base from scraped data (title, meta description, navigation, categories, brands, products, deals, footer, page text), support context-aware responses, and handle greetings as well as fallback for non-Myntra questions.

**AI Response Summary:**
- Created `chatbot.js` with `MyntraChatbot` class
- Implemented TF-IDF knowledge base construction from all data types
- Added greeting detection, Myntra relevance filter, and fallback responses
- Built context extraction (category, brand, price range detection)
- Added follow-up resolution with conversation history (last 10 exchanges)
- Built formatters for filtered products, deals, brands, and categories

**Files Created:**
- `chatbot.js`

### Prompt 3.2 — Synonym Expansion & Page Text Extraction

**User:**
> The chatbot doesn't match synonyms well — "sneakers" doesn't match "shoes". Add synonym expansion for TF-IDF queries. Also extract product types from the page text (like t-shirts, sarees, jeans) and add them as knowledge entries. Lower the TF-IDF threshold for broader matching.

**AI Response Summary:**
- Added `this.synonyms` map with 30+ synonym pairs
- Added `expandSynonyms()` method generating multiple query variants
- Added `extractProductsFromPageText()` detecting 80+ product types
- Added automatic product type grouping into categories (clothing, footwear, accessories, beauty, home)
- Lowered TF-IDF threshold from 0.08 to 0.05
- Updated TF-IDF matching to aggregate scores across all expanded queries

**Files Modified:**
- `chatbot.js`

### Prompt 3.3 — Fix Follow-up Detection

**User:**
> When I ask "show me deals" after asking about brands, it returns brands again because "show me" triggers follow-up mode. Fix the follow-up detection to not override a completely different new topic.

**AI Response Summary:**
- Made follow-up detection more conservative (removed "show me", "tell me" from trigger words)
- Changed follow-up merge to not override explicit new topics from current query
- Only merge context fields that aren't already set by the new query

**Files Modified:**
- `chatbot.js`

---

## Phase 4 — PDF Report Generator

### Prompt 4.1 — PDF Generator

**User:**
> Create a PDF report generator using PDFKit. It should produce a professional, branded report with: a dark cover page with Myntra pink accent, stats summary box, table of contents, and sections for website info, navigation, categories, brands, products, deals, and footer links. Each page should have a footer with date and page number.

**AI Response Summary:**
- Created `pdf-generator.js` with PDFKit-based generation
- Designed cover page (dark background, pink accent bar, stats box)
- Built 7 numbered sections with proper formatting and page break handling
- Added alternating row colors for product listings
- Implemented per-page footer with date and page number
- Added standalone mode for direct execution

**Files Created:**
- `pdf-generator.js`

---

## Phase 5 — Frontend UI

### Prompt 5.1 — Chat Interface

**User:**
> Build a polished Myntra-branded chat interface. The design should have a dark sidebar (320px) with logo, stats cards (products, brands, categories, deals), and suggestion chips. The main area should have a chat header, messages container with welcome message showing features, and an input area with send button. Use Myntra's pink (#FF3F6C) as the primary color.

**AI Response Summary:**
- Created responsive two-panel layout (sidebar + chat area)
- Designed dark sidebar with gradient background, logo, and stats grid
- Built message bubbles (pink gradient for user, light gray for bot)
- Added typing indicator with bouncing dots animation
- Created welcome message with feature grid
- Implemented suggestion chips for quick queries
- Added keyboard shortcuts (Ctrl+K focus, Escape blur)
- Added auto-resize text input

**Files Created/Modified:**
- `public/index.html`
- `public/style.css`
- `public/script.js`

### Prompt 5.2 — Mobile Responsiveness

**User:**
> The sidebar is hidden on mobile but there's no way to access it. Add a hamburger menu button that toggles the sidebar visible with an overlay backdrop on screens smaller than 768px.

**AI Response Summary:**
- Added hamburger SVG button in chat header (hidden on desktop, visible on mobile)
- Created sidebar overlay with dark backdrop
- Added `.sidebar.open` state with fixed positioning and z-index
- Implemented click-to-close on overlay and suggestion chip click
- Added `overflow: hidden` on body when sidebar is open

**Files Modified:**
- `public/index.html`
- `public/style.css`
- `public/script.js`

---

## Phase 6 — Backend Hardening

### Prompt 6.1 — Rate Limiting & Validation

**User:**
> Add rate limiting to the chat endpoint to prevent abuse (20 requests per minute per IP). Also add input validation — reject queries longer than 500 characters. Clean up the unused cors import.

**AI Response Summary:**
- Added in-memory rate limiter with 20 req/min per IP limit
- Added 5-minute cleanup interval for stale rate limit entries
- Added 500-character query validation with error message
- Removed unused `cors` import

**Files Modified:**
- `server.js`

---

## Phase 7 — Infrastructure

### Prompt 7.1 — .gitignore

**User:**
> Add a .gitignore file to exclude node_modules, PDF files, and server output logs.

**AI Response Summary:**
- Created `.gitignore` with `node_modules/`, `*.pdf`, `server_output.txt`, `.DS_Store`

**Files Created:**
- `.gitignore`

---

## Phase 8 — Policy Support

### Prompt 8.1 — Add Policy Knowledge

**User:**
> Add refund and cancellation policy support to the chatbot. When users ask about returns, cancellations, shipping, refunds, or product authenticity, the chatbot should provide proper detailed answers with specific policy information.

**AI Response Summary:**
- Added 5 structured policies to `scraper.js` inline fallback: returns, cancellation, shipping, payment/refund, and quality guarantee
- Each policy includes detailed content (process, timelines, conditions) and extensive keyword lists
- Added `formatPolicy()` method with specific and summary response modes
- Added policy topic detection in `extractContext()` with sub-type identification
- Added `formatPolicy` as `this.formatPolicy()` method in chatbot
- Updated enrichment logic to preserve and merge policies from fallback
- Added `cancel`, `exchange`, `guarantee`, `genuine`, `original`, `warranty` to Myntra relevance terms
- Extended `policyWords` array with `genuine`, `authentic`, `counterfeit`, `fake`
- Updated `getStats()` to include policy count
- Added Policies stat card to frontend sidebar
- Added policy suggestion chips (Return Policy, Cancel Order)

**Files Modified:**
- `scraper.js`
- `chatbot.js`
- `server.js`
- `public/index.html`
- `public/script.js`

---

## Phase 9 — Documentation

### Prompt 9.1 — README & Prompt History

**User:**
> Create a README.md file for this project and also add a Prompt.md file documenting all the prompts used from scratch.

**AI Response Summary:**
- Created `README.md` with project overview, features, tech stack, quick start, API docs, example queries, project structure, architecture explanation, and customization guide
- Created `Prompt.md` with chronological prompt history from Phase 1 through Phase 9

**Files Created:**
- `README.md`
- `Prompt.md`
