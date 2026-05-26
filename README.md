# Cloud Cost Compare

Azure-first Infrastructure Cost Calculator MVP with two independently runnable projects:

- `frontend`: Vite, React, TypeScript, Tailwind CSS, Axios, Recharts
- `backend`: Node.js, Express, TypeScript, Zod, Axios, CORS, Dotenv

There is no root package workspace and no shared root `package.json`. Install dependencies inside each folder.

## Quick Start

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Phase 1 Scope

Phase 1 starts with natural-language infrastructure input. The app extracts normalized requirements with rule-based logic, shows a review step, then calculates Azure pricing for supported VM compute.

The old manual multi-field VM input is deprioritized. The app does not price managed disks, blob storage, bandwidth, load balancer, PostgreSQL, Redis, monitoring, or backup yet; those services are returned as detected but pricing not implemented where extraction finds them.

## Pricing Assumptions

- Azure is the only provider implemented in the MVP.
- Requirement extraction is rule-based; no LLM is used yet.
- Azure Virtual Machines are the only priced service implemented in Phase 1.
- Azure Retail Prices API is used where matching Linux VM hourly meters are found.
- VM cost is `hourly unit price x number of VMs x hours`.
- Missing VM prices return zero-dollar fallback line items requiring manual review.
- No hardcoded fake prices are used.
- Actual customer pricing may vary based on enterprise agreements, reservations, savings plans, taxes, region, and Azure calculator rounding.

## Roadmap

- LLM requirement extraction
- PDF/DOCX upload support
- Azure pricing catalog database
- Managed disks, storage, databases, monitoring, backup, and networking cost sections
- AWS/GCP pricing adapters
- Excel/PDF export
