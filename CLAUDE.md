# Matchpoint

### How might we build Reflex into the only platform brands need for retail talent?

> **Active build: V2 Talent Centric** — V1 exists but is not being actively developed. V3 is experimental.  
> Variant docs: [V2](docs/claude-v2.md) · [V1](web/src/pages/variants/V1JobFocus/CLAUDE-V1-JOB-FOCUS.md) · [V3](web/src/pages/variants/V3Wildcard/CLAUDE-V3-WILDCARD.md)

# Conventions

- All UI work goes in `web/src/` — never touch `src/` for frontend changes
- Use CSS variables only — never raw hex or `rgba()` values
- **Border rule:** always `--quaternary`. Never `--black-alpha-`* or `rgba(0,0,0,*)`
- Never hardcode API keys — use `.env` (gitignored)
- Dev server: `cd web && npm run dev`

# Tech Stack


| Component     | Technology                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | React + TypeScript (Vite), `web/`                                                                                                                                                                              |
| Backend       | Node.js + Express + TypeScript, `src/`                                                                                                                                                                         |
| AI Provider   | Google AI Studio (Gemini)                                                                                                                                                                                      |
| Styling       | CSS (no framework) — see [design-system.md](docs/design-system.md)                                                                                                                                             |
| Icons         | Lucide React                                                                                                                                                                                                   |
| Hosting       | Vercel                                                                                                                                                                                                         |
| Github        | [weavrk/matchpoint](https://github.com/weavrk/matchpoint.git)                                                                                                                                                  |
| Structure     | [project-structure.md](docs/project-structure.md)                                                                                                                                                              |
| Scripts       | [scripts.md](docs/scripts.md)                                                                                                                                                                                  |
| Scrapers      | [scrapers.md](docs/scrapers.md)                                                                                                                                                                                |
| Database      | [database.md](docs/database.md)                                                                                                                                                                                |
| Worker Photos | Cloudinary, Pexels, RandomUser- social media profile pic color photo male/female STEPS: open `scripts/review-portraits.html`-> `Click a photo and :move to Final`-> `Export to app`                           |
| Supabase      | Account: [weavrk@gmail.com](mailto:weavrk@gmail.com) · [Project](https://kxfbismfpmjwvemfznvm.supabase.co) · DB: `postgresql://postgres:reflexmatchpoint123@db.kxfbismfpmjwvemfznvm.supabase.co:5432/postgres` |


# Environment Variables

Stored in `.env` (gitignored). Do NOT hardcode keys in source files.


| Variable              | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `GEMINI_API_KEY`      | Google AI Studio API key for Gemini chat (backend)                  |
| `VITE_GEMINI_API_KEY` | Same key exposed to Vite frontend (must have VITE_ prefix)          |
| `SCRAPERAPI_KEY`      | ScraperAPI key for Indeed scraping (proxy/anti-bot bypass)          |
| `PEXELS_API_KEY`      | Pexels API key for worker headshot photos (free tier: 200 req/hour) |


