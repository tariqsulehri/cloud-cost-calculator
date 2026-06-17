# Cloud Cost Calculator - App Review and Roadmap

This document explains what the app does today, what it cannot do yet, and how the next Azure, AWS, GCP, and combined cost views should work.

The language is intentionally simple so product users, finance users, and non-native English speakers can review it.

## 1. Product Goal

The app helps a user turn a cloud requirement into a cost estimate.

The user can:

- Paste a requirement in normal language.
- Improve the text if it is unclear.
- Find cloud services from the text.
- Review missing information.
- Calculate a cost estimate.
- See what is included and what is not included.

The app should not hide missing cost. If a service cannot be priced, it must be shown clearly.

## 2. Current Version Includes

Current working version focuses on Azure.

The app can:

- Read infrastructure text.
- Detect cloud services.
- Map generic services to Azure services.
- Ask for missing details.
- Show simple status badges.
- Show easy tooltips for badges.
- Search service mapping across Azure, AWS, and GCP.
- Show a guided AI help preview for plain-English estimate questions.
- Calculate supported Azure cost lines.
- Add optional Azure costs such as Managed Disks, NAT Gateway, Firewall, Public IP, Private Endpoint, App Service, SQL Database, Key Vault, Backup, DNS, Front Door, and Container Apps.
- Calculate early proposal AWS and GCP cost lines using planning rates.
- Compare Azure, AWS, and GCP totals side by side.
- Keep a selected base cloud for comparison.
- Show automatic field mapping from the base cloud to the other clouds.
- Show unpriced services separately.
- Keep unsupported items visible instead of adding fake cost.

Current Azure pricing support includes selected meters for:

- Azure Virtual Machines
- AKS worker node compute
- Azure Blob Storage capacity
- Azure Bandwidth internet egress
- Azure CDN Standard Microsoft transfer and requests
- Azure Application Gateway Standard v2
- Azure Cache for Redis
- Azure Service Bus
- Azure Monitor / Log Analytics
- Azure Database for PostgreSQL Flexible Server

Optional Azure add-ons use early proposal planning rates today. They are useful for first proposal sizing, but they should be validated with Azure Calculator or exact Azure Retail Prices API meter adapters before a final client quote.

Some of these services still have limited pricing coverage. The app explains these limits in assumptions and unpriced sections.

## 2.1 Phase 1 Catalog Foundation

Phase 1 imports the cloud service mapping from `Cloud_Services_Mapping.xlsx`.

Current catalog result:

- 138 service mapping groups from the Excel file.
- Azure, AWS, and GCP rows for each mapping group.
- Extra curated rows for pricing helpers already used by the app.
- Source category saved with each service.
- Mapping status saved with each service:
  - `mapped`: a matching service exists.
  - `no_direct_equivalent`: the source file says there is no direct equivalent.
  - `manual_review`: the source file has a mapping, but also says review is needed.

Important: this is a service catalog and mapping foundation. It does not mean AWS and GCP pricing is active yet.

## 3. What Is Not Possible Yet

The app cannot yet give a full production cloud bill.

Important limits:

- AWS live provider pricing is not implemented yet.
- GCP live provider pricing is not implemented yet.
- AWS and GCP currently use early proposal planning rates only.
- Enterprise discounts are not applied.
- Reserved instances and savings plans are not applied.
- Taxes are not included.
- Currency conversion is not included.
- Some Azure meters are excluded unless explicitly modeled.
- Optional Azure add-ons are priced only when the user selects them and fills the required fields.
- Some services need manual review when sizing is missing.

The app should say "Price not ready" or "Can't price" instead of showing wrong numbers.

The AI help tab is not a full chat assistant yet. It gives safe answers from current app data only.

## 4. Platform Limitations

### Azure

Azure is active today.

Current limitations:

- Uses public Azure Retail Prices API only.
- Does not use customer contract prices.
- Does not include all dependent services automatically.
- Does not include every storage operation, backup, snapshot, private endpoint, public IP, firewall, DNS, WAF, or support charge.
- Optional items can be selected manually for early proposal pricing.
- Some VM sizes require manual SKU mapping.

### AWS

AWS early proposal estimate is active.

Current limitation:

- Uses internal planning rates, not live AWS Pricing API.

Needed before final AWS calculation:

- AWS pricing adapter.
- AWS service SKU mapping.
- Region mapping.
- EC2 instance family and size mapping.
- RDS, ElastiCache, S3, CloudFront, ALB/NLB, CloudWatch, SQS, and data transfer pricing rules.

### GCP

GCP early proposal estimate is active.

Current limitation:

- Uses internal planning rates, not live Google Cloud pricing data.

Needed before final GCP calculation:

- GCP pricing adapter.
- GCP service SKU mapping.
- Region mapping.
- Compute Engine machine type mapping.
- Cloud SQL, Memorystore, Cloud Storage, Cloud CDN, Load Balancing, Cloud Logging, Pub/Sub, and network pricing rules.

### Combined Cost View

Combined view is active for early comparison.

It should compare:

- Azure total
- AWS total
- GCP total
- Difference between providers
- Services included in each estimate
- Services not priced for each provider
- Confidence level for each provider

The combined view should not hide weak coverage. A provider total should be marked partial if some services are missing.

Current combined view behavior:

- The user can choose Azure, AWS, or GCP as the base cloud.
- The app maps base-cloud answers into a common pricing model.
- The app maps the common model to Azure, AWS, and GCP fields.
- The app shows a mapping review table before calculation.
- The app does not ask the same question three times.
- The app marks important provider-specific choices as Review when the cost can change.

## 5. Multi-Cloud UI Plan

The UI should use four top tabs:

1. Azure
2. AWS
3. GCP
4. Compare

### Azure Tab

Shows the current Azure estimate.

Status: active now.

### AWS Tab

Shows AWS early proposal estimate.

Status: active for planning only.

### GCP Tab

Shows GCP early proposal estimate.

Status: active for planning only.

### Compare Tab

Shows side-by-side totals.

Recommended layout:

- One row for each provider.
- Monthly cost.
- Annual cost.
- Coverage percent.
- Missing services count.
- Confidence badge.
- Link to details.

## 6. Mapping Strategy

The project already has service mapping.

We should continue using that mapping.

Example mapping:

| Requirement | Azure | AWS | GCP |
| --- | --- | --- | --- |
| Virtual machines | Azure Virtual Machines | Amazon EC2 | Compute Engine |
| Kubernetes | AKS | EKS | GKE |
| PostgreSQL | Azure Database for PostgreSQL | Amazon RDS PostgreSQL | Cloud SQL PostgreSQL |
| Redis | Azure Cache for Redis | ElastiCache Redis | Memorystore Redis |
| Object storage | Azure Blob Storage | Amazon S3 | Cloud Storage |
| CDN | Azure CDN / Front Door | CloudFront | Cloud CDN |
| Load balancer | Application Gateway / Load Balancer | ALB / NLB | Cloud Load Balancing |
| Private network | Azure Virtual Network | Amazon VPC | Virtual Private Cloud |
| Queue | Service Bus | SQS / EventBridge | Pub/Sub |
| Monitoring | Azure Monitor | CloudWatch | Cloud Monitoring |
| Network egress | Azure Bandwidth | AWS Data Transfer | Network Data Transfer |

Each provider should have its own pricing adapter. The normalized requirement should stay shared.

The Service Mapping tab should be used before building AWS and GCP pricing. It helps the team confirm that one requirement maps to the correct provider service names.

## 6.1 Pricing Question Catalog

The app now has a frontend pricing question catalog.

The catalog defines common cost questions for each service type. Examples:

- Compute: quantity, vCPU, memory, operating system, monthly hours.
- Database: engine, vCPU, memory, storage size, storage type, high availability.
- Cache: engine, memory, tier, high availability.
- Object storage: stored data, access tier, redundancy.
- Load balancer: HTTP/S or TCP, traffic target.

The catalog also marks cost impact:

- `high`: can strongly change the estimate.
- `medium`: can change the estimate, but usually less than core sizing.
- `low`: useful context, but not always a major cost driver.

Provider mapping examples:

| Common value | Azure | AWS | GCP |
| --- | --- | --- | --- |
| SSD database storage | Premium/Standard SSD | gp3 SSD | SSD persistent disk |
| High availability | Zone redundant / HA | Multi-AZ | Regional availability |
| HTTP/S load balancer | Application Gateway / Front Door | Application Load Balancer | External HTTP(S) Load Balancer |
| Hot object storage | Hot tier | S3 Standard | Standard storage |

This catalog is the first step toward asking only the right questions for each cloud.

## 6.2 Implementation Plan

Recommended build order:

1. Keep Azure estimate stable.
   - Do not break the current Azure pricing flow.
   - Keep missing and unpriced services visible.

2. Add service mapping search.
   - Select Azure, AWS, or GCP first.
   - Search inside that provider's real service list.
   - Select a catalog service instead of typing a free-form service name.
   - Show Azure, AWS, and GCP names side by side.
   - Mark Azure as pricing active and AWS/GCP as mapping only until adapters are ready.

3. Add guided AI help.
   - Explain missing fields.
   - Explain not-priced services.
   - Explain estimate summary for a client.
   - Explain that AWS/GCP comparison is planned.
   - Do not invent pricing.

4. Add AWS pricing adapter.
   - Start with EC2, RDS PostgreSQL, S3, CloudFront, ALB, ElastiCache Redis, SQS, CloudWatch, and data transfer.
   - Use the same normalized requirement model.

5. Add GCP pricing adapter.
   - Start with Compute Engine, Cloud SQL PostgreSQL, Cloud Storage, Cloud CDN, Cloud Load Balancing, Memorystore Redis, Pub/Sub, Cloud Logging, and network egress.
   - Use the same normalized requirement model.

6. Add combined comparison.
   - Show Azure, AWS, and GCP totals.
   - Show annual cost.
   - Show coverage percent.
   - Show services not included per provider.
   - Mark totals as partial when needed.

7. Extend the pricing question catalog.
   - Move common/provider-specific question definitions to backend or database when stable.
   - Add dropdown options for more provider-specific fields.
   - Use provider pricing APIs to enrich allowed SKU values where possible.

## 7. Recommended User Flow

The process should stay simple.

1. Describe
   - User pastes requirement text.
   - User can click Improve text if needed.
   - User clicks Find services.

2. Review
   - App shows detected services.
   - User sees easy badges:
     - Ready
     - Need info
     - Price not ready
     - Can't price
   - User fills missing fields.
   - User can select optional Azure add-ons if the customer needs them.
   - Optional add-ons say Need info until all required values are filled.

3. Calculate
   - User clicks Calculate cost.
   - App shows included cost lines.
   - App shows missing or excluded services.

4. Compare
   - User switches between Azure, AWS, GCP, and Compare tabs.
   - The last selected Azure/AWS/GCP tab becomes the base cloud.
   - The app maps base-cloud answers to the other clouds.
   - User reviews only important mapped fields or missing values.

## 8. Badge Meanings

Use simple English.

| Badge | Meaning |
| --- | --- |
| Ready | This service has enough information to calculate cost. |
| Need info | Some details are missing. Add them before calculation. |
| Price not ready | The app detected this service, but pricing is not built yet. |
| Can't price | The app cannot price this service or setup right now. |
| High match | The app found clear details. |
| Medium match | Some details may need checking. |
| Low match | The app is not sure. Review carefully. |

## 9. Technology Used

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-style local components
- Radix UI primitives
- Lucide icons
- Vitest and Testing Library

Backend:

- Node.js
- Express
- TypeScript
- Zod validation
- Axios
- Better SQLite3
- Azure Retail Prices API
- OpenAI requirement extraction when configured
- Rule-based fallback extraction
- Vitest

Data:

- SQLite catalog tables
- Cloud service mapping
- Azure retail price meter data

## 10. Folder Structure

Recommended documentation structure:

```text
documentation/
  app-review-and-roadmap.md
  architecture/
    pricing-adapters.md
    service-mapping.md
  product/
    user-flow.md
    badge-language.md
  platform-limits/
    azure.md
    aws.md
    gcp.md
```

Current code structure:

```text
backend/
  src/
    database/
    routes/
    scripts/
    services/
    types/
    utils/

frontend/
  src/
    components/
    lib/
    types/

documentation/
  app-review-and-roadmap.md
```

## 11. Future Enhancements

High priority:

- Add AWS pricing adapter.
- Add GCP pricing adapter.
- Add provider tabs with real calculated totals.
- Add combined comparison tab.
- Add coverage score per provider.
- Add line item dependency expansion.
- Add clear "included" and "not included" cost sections.

Medium priority:

- Add reservations and savings plan options.
- Add customer discount inputs.
- Add currency selection.
- Add export to PDF or Excel.
- Add saved estimate history.
- Add scenario comparison, for example dev, staging, production.

Advanced future work:

- Import Terraform or Bicep.
- Import cloud bill data.
- Recommend right-sizing.
- Show cost risk alerts.
- Show carbon or sustainability estimate.

## 12. Professional UI Direction

Use a calm FinOps style.

Recommended UI rules:

- Use clear provider tabs.
- Keep Azure blue as the active provider color.
- Use amber for items needing user action.
- Use green for ready or complete items.
- Use red only for blocked or cannot price.
- Avoid too many bright colors on one card.
- Keep card titles dark navy.
- Keep badges short.
- Explain badges with tooltips.
- Keep action buttons direct:
  - Improve text
  - Find services
  - Apply changes
  - Calculate cost

The UI should feel like a finance and architecture review tool, not a developer-only dashboard.
