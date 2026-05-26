# Cloud Cost Compare Frontend

Vite + React + TypeScript frontend for the Cloud Cost Compare MVP.

Phase 1 now starts with natural-language requirement input. The old manual VM text-box flow is deprioritized in favor of:

1. Describe infrastructure in one prompt.
2. Review detected region and components, including whether extraction was AI-assisted or rule-based fallback.
3. Confirm reviewed requirements and calculate the Azure estimate for supported VM compute.

## Setup

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Environment

Copy `.env.example` to `.env` and set the backend API URL.

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Scripts

```bash
npm run dev
npm run build
npm test
npm run preview
```

## Notes

- State uses React hooks only.
- API calls use Axios.
- Styling uses Tailwind CSS.
- The UI focuses on Azure region and Azure pricing for the current phase.
- The UI shows the extraction method returned by the backend.
- The backend maps provider service equivalents and pricing status after extraction.
- The UI shows all detected infrastructure components before pricing, including storage, Kubernetes, serverless, queueing, monitoring, backup, security, and networking when present.
- Only Azure VM compute pricing is calculated in Phase 1.
- Services without pricing adapters are shown as detected but excluded from the estimate total.
- Estimates use Azure public retail pay-as-you-go VM pricing from Azure Retail Prices API where implemented.

## Roadmap

- Editable review cards for AI-assisted extraction output.
- PDF/DOCX upload support.
- Azure pricing catalog database.
- Managed disks, storage, databases, monitoring, backup, and networking cost sections.
- AWS/GCP pricing adapters.
- Excel/PDF export.
