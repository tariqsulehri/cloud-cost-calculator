# Cloud Cost Calculator - App Review and Roadmap

This document explains what the app does today, what it cannot do yet, and how the next Azure, AWS, GCP, and combined cost views should work.

The language is intentionally simple so product users, finance users, and non-native English speakers can review it.

## 1. Product Goal

The app helps a user turn a cloud requirement into a cost estimate.

The user can:

- Paste a requirement in normal language.
- Build a requirement with Magic Requirement Builder.
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
- Build a professional prompt from selected catalog services.
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
- Ask smart pricing questions for selected services in the Magic Requirement Builder.
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

## 6.2 Magic Requirement Builder

The app includes a Magic Requirement Builder in Step 1.

Current behavior:

- User selects Azure, AWS, or GCP.
- User searches real services from the cloud service catalog.
- User adds one or more services to a selected list.
- The app asks service-specific pricing questions.
- Required questions are shown first.
- Optional pricing details are collapsed.
- The app generates a professional requirement prompt.
- User can paste the generated prompt into the main requirement text area.

Important design decision:

The feature creates a prompt, but its main job is to collect structured cloud requirements first. This is better than free text only because the same answers can later support direct calculation, service mapping, exports, and provider pricing adapters.

Future improvements:

- Add "Use prompt and find services" as one action.
- Save prompt templates for common workloads.
- Add client proposal templates.
- Add provider-specific dropdowns for SKU, region, tier, storage type, and HA choices.
- Move the question catalog to backend or database when stable.

## 6.3 Implementation Plan

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

## 8. Badge And Sign Meanings

Use short labels in the UI. Use tooltips or this guide for the full meaning.

### Service Review Badges

| Badge / sign | Color | Meaning | User action |
| --- | --- | --- | --- |
| Ready | Green | The service has enough information to calculate cost. | No action needed before estimate. |
| Need info | Amber | Some required details are missing. | Add the missing values, then calculate again. |
| Price not ready | Purple / blue | The service was detected, but the pricing adapter is not built yet. | Keep it visible. Do not include it in the official total. |
| Can't price | Red | The app cannot price this service or setup right now. | Review manually or use the provider calculator. |
| Review | Amber | The app found a mapping or approximate value, but it should be checked before a client quote. | Check the row before sharing final numbers. |

### Match Confidence Badges

These badges explain how confident the app is about the extracted requirement.

| Badge | Meaning | User action |
| --- | --- | --- |
| High match | The app found clear service details in the requirement text. | Usually safe to continue. Still review important costs. |
| Medium match | The app found the service, but some details may be uncertain. | Check the service details and missing fields. |
| Low match | The app is not sure about the service or sizing. | Review carefully before calculation. |

### Mapping Badges

These badges appear in the automatic cloud mapping table.

| Badge / sign | Color | Meaning | User action |
| --- | --- | --- | --- |
| Mapped | Green | The value was mapped to this cloud provider. | No action unless the value looks wrong. |
| Review | Amber | The value was mapped, but a cloud-specific choice can change the price. | Check this row before final quote. |
| Missing | Red | The app does not have a value for this provider field. | Add the value or confirm a default. |

### Cost Impact Badges

These badges explain how strongly a field can change cost.

| Badge | Meaning | User action |
| --- | --- | --- |
| High impact | This field can strongly change the estimate. Example: VM size, storage size, HA, region. | Review carefully. Wrong value can create a big cost difference. |
| Medium impact | This field can change cost, but usually less than core sizing. Example: storage tier or load balancer type. | Check if the client gave a clear preference. |
| Low impact | This field is useful context, but may not change cost much in early estimates. | Review if available. Do not block the first estimate unless required. |

### Coverage And Total Badges

These badges explain how complete the estimate is.

| Badge / sign | Meaning | User action |
| --- | --- | --- |
| 100% priced | All detected services for that provider are priced. | Good for comparison. Still check assumptions. |
| 80% priced | Most services are priced, but at least one service is excluded. | Compare carefully. Lower total may mean missing cost. |
| 50%-79% priced | Only part of the design is priced. | Do not use as final cost. Review excluded services. |
| Less than 50% priced | Many services are not included. | Treat as incomplete. Do not share as final estimate. |
| Partial | Some services are priced and some are not. | Use only as early estimate. |
| Complete | All detected services that the app can price are included. | Can be used for proposal review, with assumptions. |
| Blocked | The app cannot create a useful total yet. | Add missing details or use supported services. |

### Similar Cost And Guidance Badges

These labels appear when a service is not calculated but the app can show an approximate idea.

| Label | Meaning | User action |
| --- | --- | --- |
| Similar cost idea | Show a rough range from a similar cloud service. | Use only for planning discussion. |
| Also show in cost table | Add the rough range as a visible row in the cost table. | Keep it visible, but do not treat it as official cost. |
| Guide only | This is approximate guidance, not calculated pricing. | Do not use it as the official total. |
| Not in total | This row is not included in the official calculated total. | Add manually only after validation. |
| Planning range with unpriced services | Official calculated total plus rough guidance range. | Use for early planning only. |
| Calculated total | The real total calculated by the app from implemented pricing logic. | This is the main cost number. |

Example:

- Calculated total: `US$1,842.24`
- Similar cost guidance: `US$150 - US$1,200`
- Planning range: `US$1,992.24 - US$3,042.24`

The calculated total is still `US$1,842.24`.
The planning range is only a possible range if the unpriced service is later added.

### Cloud Source Badges

| Badge / sign | Meaning | User action |
| --- | --- | --- |
| Azure price | Price came from Azure public pricing or an Azure adapter. | Good for Azure early estimate. Validate final quote if contract pricing applies. |
| Early proposal | Price came from internal planning rates, not live provider API. | Use for first-pass comparison only. Validate before final quote. |
| Early proposal rate card | The provider estimate uses planning rates maintained inside the app. | Use for proposal discussion. Do not treat as provider-confirmed pricing. |
| Fallback | The exact provider price was not found, so the app used a fallback rule or default. | Review before using this cost. |
| Estimated | The app used a rule or planning rate. | Validate before final client quote. |
| Manual / Review source | The exact source is not strong enough for final pricing. | Review manually. |

### Pricing Source And System Messages

These messages explain where the number came from, or why a number is missing.

| Message | Type | Meaning | User action |
| --- | --- | --- | --- |
| Azure price | Pricing source | The line item used Azure public pricing data or an Azure pricing adapter. | Good for early Azure estimate. Validate with customer contract pricing if needed. |
| Price came from the Azure public pricing API. | Tooltip text | The app found the price from Azure public retail pricing. | Use as calculated public price. |
| Early proposal | Pricing source | The app used planning rates, not live provider prices. | Use for first-pass proposal only. |
| Planning rate only. Validate with provider calculator or contract pricing before final quote. | Tooltip text | This number is approximate and should be checked before final use. | Validate with AWS Calculator, Azure Calculator, GCP Calculator, or contract pricing. |
| Early proposal rate card | Provider note | AWS or GCP estimate is based on internal planning rates. | Good for side-by-side discussion, not final billing. |
| Fallback | Pricing source | Exact price was not found. The app used a default or fallback rule. | Review before client sharing. |
| The exact price was not found. Review before using this cost. | Tooltip text | The cost may be less accurate than API pricing. | Check provider calculator or update adapter mapping. |
| Price adapter not ready | Table message | The service is detected, but the app does not have pricing logic for it yet. | It is excluded from official total. Use guidance only if shown. |
| Pricing adapter not ready | Table message | Same meaning as Price adapter not ready. It appears in SKU / Meter for guidance rows. | Treat the row as approximate and not official. |
| Price not ready | Service status | The app can see the service, but cannot calculate it yet. | Keep visible. Do not add to calculated total. |
| Not calculated | Section title | These services are excluded from official totals. | Expand the section and review missing or unsupported services. |
| Review excluded services | Section title | A list of services that need manual attention. | Check each row before client sharing. |
| Similar service guide | Table message | The app is showing a similar service range, not exact pricing. | Use only as planning guidance. |
| Guide only (not in total) | Source label | This approximate row is visible, but excluded from calculated total. | Do not present it as official cost. |
| Approximate planning range. This row is excluded from official calculated totals. | Tooltip text | This is only a helpful range for an unpriced service. | Validate before adding to any final total. |
| Planning total incl. guidance | Summary label | Calculated total plus approximate guidance range. | Rename in UI to "Planning range with unpriced services" if possible for clearer English. |
| Official total above is unchanged. | Summary note | Guidance did not change the real calculated total. | Use the calculated total as the official app total. |
| Review needed | Landscape notice | Some mapped, approximate, or not-calculated items should be checked. | Review before exporting or sharing with a client. |
| Not included in total | Message | The item is visible but excluded from official cost. | Add manually only after validation. |
| Excluded | Count label | Number of services not included in the provider total. | Review these services before comparing providers. |
| Public Azure pricing where implemented | Provider note | Azure uses public pricing for services where adapters exist. | Validate final numbers if client has contract discounts. |
| Azure pricing is active where adapters exist. | Review notice | The app can price only implemented Azure adapters. | Services outside adapters remain excluded. |
| Services marked Need info, Price not ready, or Can't price are not included in the total. | Review notice | Some detected services may not be in the total. | Fix missing info or validate manually. |
| Rule-based fallback | Extraction / pricing note | The app used local rules because AI or exact mapping was not available. | Review the output more carefully. |

Guideline:

- Use **Calculated total** for the real app total.
- Use **Planning range** for totals that include approximate guidance.
- Never mix guidance rows into the official total unless the service has a real pricing adapter.
- In exports, keep `Guide only`, `Not in total`, and `Review needed` visible.

### Recommended Tooltip Text

Use these short tooltip texts in the UI:

| Badge | Tooltip text |
| --- | --- |
| Ready | Enough details are present. This service can be priced. |
| Need info | Add missing values before estimating this service. |
| Price not ready | Pricing logic for this service is not built yet. It is excluded from the total. |
| Can't price | This setup is not supported by the app right now. |
| Review | Check this mapped or approximate item before client sharing. |
| Mapped | This value was mapped to the selected cloud provider. |
| Missing | The app does not have this value yet. |
| High impact | This value can strongly change the cost. |
| Medium impact | This value can change cost and should be checked. |
| High match | The app is confident about this detected service. |
| Medium match | The app detected this service, but some details may need review. |
| Guide only | Approximate only. This is not official calculated cost. |
| Not in total | This row is visible for planning, but excluded from the calculated total. |

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
