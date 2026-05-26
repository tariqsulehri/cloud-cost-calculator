# Cloud Cost Compare Backend

Express + TypeScript API for natural-language infrastructure extraction and Azure VM cost estimates.

Phase 1 follows this flow: prompt input, OpenAI structured extraction, Zod validation, user review, backend service mapping, deterministic pricing adapter lookup, and cost calculation. The existing rule-based extractor remains as a fallback. Services without pricing adapters are still detected and returned with pricing status metadata instead of being ignored.

## Setup

```bash
npm install
npm run dev
```

The API runs on `http://localhost:4000`.

## Environment

Copy `.env.example` to `.env` and adjust values as needed.

```env
PORT=4000
NODE_ENV=development
AZURE_RETAIL_PRICES_API_URL=https://prices.azure.com/api/retail/prices
CORS_ORIGIN=http://localhost:5173
DEFAULT_CURRENCY=USD
MONTHLY_HOURS=730
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

## Scripts

```bash
npm run dev
npm run build
npm test
npm start
```

## Pricing Assumptions

- Natural-language extraction is AI-assisted through OpenAI structured JSON output; rule-based extraction is used only as a fallback.
- OpenAI extracts requirements only. Pricing remains deterministic in the backend pricing services.
- Backend service mapping is authoritative for Azure/AWS/GCP equivalents and pricing status.
- Azure Virtual Machines are the only priced service in Phase 1.
- Linux Ubuntu standard-tier pay-as-you-go VM hourly compute is the only supported pricing path.
- Azure Retail Prices API is used when matching VM hourly meters are found.
- API responses are cached in memory by request URL during the server runtime.
- VM cost is `unitPrice x quantity x hours`.
- Missing Azure VM prices produce zero-dollar fallback line items with `pricingSource = "fallback"` and `confidence = "low"`.
- Non-VM services are returned as `notImplementedLineItems`, `unsupportedLineItems`, or `missingRequiredFieldLineItems` based on extraction status.
- The API never silently invents hardcoded prices.
- Actual pricing may vary based on enterprise agreements, reservations, savings plans, taxes, region, and Azure calculator rounding.

## Endpoints

- `GET /api/health`
- `GET /api/azure/regions`
- `GET /api/azure/vm-options`
- `POST /api/requirements/extract`
- `POST /api/estimate`

## Roadmap

- Improve LLM extraction confidence scoring and review/edit workflows.
- PDF/DOCX upload support and document parsing.
- Azure pricing catalog database with scheduled refresh and historical pricing snapshots.
- Managed disks, storage, databases, monitoring, backup, and networking cost sections.
- AWS/GCP pricing adapters behind a provider-neutral interface.
- Excel/PDF estimate export with assumptions and line-item detail.
