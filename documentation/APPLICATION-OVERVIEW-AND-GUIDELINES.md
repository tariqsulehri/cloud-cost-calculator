# Cloud Cost Calculator - Application Goal, Guidelines & Architecture Specification

## 1. Application Goal & Product Vision

The **Multi-Cloud Cost Calculator** is an enterprise-grade solution architecture tool designed to turn plain-text infrastructure requirements into deterministic, highly accurate cost estimates and executive proposal presentations across **Microsoft Azure, Amazon Web Services (AWS), and Google Cloud Platform (GCP)** without requiring user authentication or cloud account sign-in.

### Key Goals:
- **Instant Natural Language Sizing**: Transform informal client requirements (e.g., *"2 web servers, PostgreSQL database, Redis cache, CDN, Load balancer"*) into structured cloud service line items.
- **Side-by-Side Multi-Cloud Comparison**: Provide instant 3-way cost alignment between Azure, AWS, and GCP for informed multi-cloud decision making.
- **Executive Proposal Generation**: Generate 1-click Markdown (`.md`) and styled PDF (`.pdf`) proposal documents complete with 3-Year Total Cost of Ownership (TCO) projections and Savings Plan (1-Yr / 3-Yr) comparisons.
- **Zero Fake Costs**: Maintain strict transparency—if a cloud service meter is missing or unpriced, it is clearly flagged rather than populated with inaccurate or fabricated numbers.

---

## 2. Core Guidelines & Architectural Principles

### 1. **"No Fake Pricing" Guideline**
If a service SKU or regional meter is unavailable in public rate cards, the system marks it as `Price not ready` or `Needs review` and excludes it from calculated totals. Estimated planning ranges are displayed separately as guidance.

### 2. **Progressive Elaboration (3-Tier Prompt Strategy)**
- **Tier 1 (Core Workload Prompt)**: Focuses on core infrastructure anchors (Compute, Database, Cache, Storage, Load Balancer).
- **Tier 2 (Enterprise Add-Ons Overlay)**: Provides 1-click controls to selectively add enterprise security (Firewalls, NAT Gateways, Key Vaults, Backup retention).
- **Tier 3 (Executive Proposal)**: Presents baseline compute costs alongside optional security add-ons to prevent client "sticker shock".

### 3. **Live Public Catalog Parity**
Where adapters exist, prices are dynamically derived from official public cloud rate cards (Azure Retail Prices REST API, AWS Public Price Lists, GCP Cloud Billing Catalog) with 95%+ pay-as-you-go accuracy.

---

## 3. Features & Capabilities

| Feature Module | Description & Capabilities |
| :--- | :--- |
| **Natural Language Parsing** | Parses unstructured text requirements using LLM AI extraction with local rule-based pattern matching fallback. |
| **Magic Requirement Builder** | Guided interactive prompt creator with smart service search and automated parameter question catalog. |
| **Provider Adapter Engine** | Strategy pattern implementation (`ICloudPricingAdapter`) isolating Azure, AWS, and GCP pricing logic into decoupled, scalable modules. |
| **3-Way Cross-Cloud Mapping** | Normalizes workload inputs and maps parameters across Azure, AWS, and GCP equivalents without redundant data entry. |
| **Pricing Readiness & Accuracy Dialog** | In-app modal detailing *why* specific items are unpriced, accuracy metrics (90-95%+), and standard pricing exclusions. |
| **Interactive Calculation Feedback** | Animated `Loader2` calculation spinner and dynamic loading state feedback. |
| **Calculation Completed Modal** | High-impact success dialog displaying monthly/annual totals, priced coverage breakdown, and quick export actions. |
| **Visual TCO Analytics Charts** | Compact, smart collapsible charts displaying multi-cloud spend comparisons and 36-month cumulative TCO timeline projections. |
| **Executive Proposal Generator** | 1-click export of proposal documents in Markdown (`.md`) and styled print-ready PDF (`.pdf`) formats. |

---

## 4. Pricing Coverage: Covered vs Not Covered

### ✅ Covered (In Scope)

#### **Microsoft Azure** (`Live` API Engine):
- **Compute**: Azure Virtual Machines (B, D, E, F, M series Linux/Windows) & AKS worker node compute.
- **Databases**: Azure Database for PostgreSQL Flexible Server, Azure SQL Database.
- **Storage**: Azure Blob Storage (Hot/Cool/Archive), Managed Disks (P4–P50 Premium SSD).
- **Caching**: Azure Cache for Redis (Basic, Standard, Premium).
- **Networking**: Application Gateway v2 (HTTP/S), Standard Load Balancer, Internet Egress Data Transfer.
- **Security & Ops**: Azure Firewall, NAT Gateway, Public IP, Key Vault, Azure Monitor / Log Analytics.

#### **Amazon Web Services (AWS)** (`Public` Catalog Engine):
- **Compute**: Amazon EC2 On-Demand instances (t3, m5, m7i, c6i Linux/Windows) & AWS Lambda duration/requests.
- **Databases**: Amazon RDS for PostgreSQL (Single-AZ & Multi-AZ), General Purpose SSD (gp2/gp3).
- **Storage**: Amazon S3 (Standard, Infrequent Access, Glacier Deep Archive), EBS volumes (`gp2`, `gp3`, `io1`, `io2`).
- **Caching**: Amazon ElastiCache for Redis (t4g, r7g node tiers).
- **Networking**: Application Load Balancer (ALB), Network Load Balancer (NLB), NAT Gateway ($0.045/hr), CloudFront transfer/requests.
- **Operations**: Amazon CloudWatch custom log ingestion, SQS standard messaging.

#### **Google Cloud Platform (GCP)** (`Early` / Catalog Engine):
- **Compute**: Compute Engine instances (e2, n2 standard/custom shapes), GCP Cloud Run serverless compute.
- **Databases**: Cloud SQL for PostgreSQL (zonal vCPU, RAM, standard storage).
- **Storage**: Cloud Storage (Standard, Nearline, Coldline, Archive), Persistent Disk (pd-standard, pd-balanced, pd-ssd).
- **Caching**: Memorystore for Redis (Basic & Standard HA capacity).
- **Networking**: External Application Load Balancer, Network Data Transfer egress, Cloud CDN cache transfer.
- **Operations & Messaging**: Cloud Logging storage, GCP Pub/Sub data volume ingestion ($0.040/GB).

---

### ❌ Not Covered (Exclusions & Out of Scope)

1. **Enterprise Negotiated Discounts**: Customer-specific Enterprise Agreements (EA), Microsoft MACC commitments, AWS EDP discounts, or GCP private rate cards are excluded.
2. **Proprietary OS & Third-Party Licensing**: High-cost proprietary software licenses (Red Hat Enterprise Linux, SUSE, Oracle DB Enterprise Edition) are excluded unless standard Linux Ubuntu is specified.
3. **Inter-Region & Cross-AZ Egress**: Internal availability zone data transfer ($0.01/GB) and cross-region VPC peering transfer require explicit network topology inputs.
4. **Snapshot Retention Overage**: Storage snapshot retention beyond standard automated single-day backup policies is excluded.
5. **Taxes, VAT, and FX Conversion**: Local country sales taxes, VAT, and dynamic currency conversions are excluded (all baseline calculations are in USD).

---

## 5. Technical Dependencies & Technology Stack

### **Frontend Architecture**:
- **Framework**: React 18, Vite 5, TypeScript 5.
- **Styling**: TailwindCSS 3 (Vanilla CSS utility system with HSL dark mode support), Lucide React (Icons).
- **Visualization**: Recharts (Compact Responsive Containers, Bar Charts, Line/Area Charts).
- **Testing**: Vitest, React Testing Library, JSDOM.

### **Backend Architecture**:
- **Runtime**: Node.js v20+, Express.js, TypeScript.
- **Database / Caching**: SQLite (`better-sqlite3` native binaries) & PostgreSQL (`pg`) for price catalog caching.
- **HTTP Client**: Axios with exponential backoff & retry interceptors.
- **Testing**: Vitest API integration test suite (104 backend tests passing).

---

## 6. Architectural Considerations & Future Roadmap

1. **Offline-First Catalog Caching**:
   - The system utilizes local SQLite/PostgreSQL caching for Azure Retail Prices, AWS Price Lists, and GCP Billing APIs to ensure sub-10ms pricing lookups without hitting external rate limits.

2. **Decoupled Strategy Adapter Pattern**:
   - Adding a new cloud provider (e.g., Oracle Cloud Infrastructure, DigitalOcean) requires only implementing the `ICloudPricingAdapter` interface without modifying core estimation orchestration logic.

3. **PDF Export Engine**:
   - HTML print template generation (`generateHtmlProposal`) enables native 1-click browser PDF rendering without heavy server-side headless browser overhead.

4. **Future Sprints**:
   - Custom Enterprise Discount Profile importer (allowing clients to upload custom EDP/EA discount percentages).
   - Automated Terraform / IaC code generator from calculated requirements.
