# Cloud Cost Calculator - Badges & Indicators Guide

This document provides a comprehensive reference guide to all badges, color-coded status tags, confidence levels, and indicators used in the Multi-Cloud Cost Calculator.

---

## 1. Provider Source Badges (Header Tabs)

Located on the top provider tabs (`Azure`, `AWS`, `GCP`, `Compare`, `Docs`), these badges indicate the **data engine** and **pricing accuracy model** currently backing each cloud provider.

| Badge | Provider | Data Engine & Source | Pricing Accuracy Level | Meaning & Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **`Live`** (Blue) | Azure | Azure Retail Prices REST API | **95% – 100%** | Queries live pay-as-you-go public pricing meters per region, SKU, vCPU/RAM, and storage tier. |
| **`Public`** (Amber) | AWS | AWS Public Price List API | **90% – 95%** | Matches standard EC2 instance rates, EBS volumes (`gp3`), and RDS rates from public price catalogs. |
| **`Early`** (Emerald) | GCP | Proposal Rate Card | **85% – 90%** | Uses benchmark baseline rate cards for GCP Cloud Run, Pub/Sub, Compute Engine, and Cloud Storage for early client proposals. |
| **`Compare`** (Violet) | Compare | Side-by-side Multi-Cloud Engine | **Cross-Cloud View** | Normalizes a single requirement across Azure, AWS, and GCP simultaneously. |
| **`Guide`** (Sky) | Docs | Documentation & Operations | **Reference** | Opens in-app guidelines, architecture references, and badge explanations. |

---

## 2. Priced Coverage Badges

Once you click **Calculate Cost**, the provider badges dynamically change to display the **Coverage Percentage** of your architecture.

| Badge | Coverage Range | Color | Description & Recommended Action |
| :--- | :--- | :--- | :--- |
| **`100%`** | 100% Priced | Green / Emerald | **Complete Coverage**: Every single detected component has valid specs and is priced. |
| **`50% – 99%`** | Partial Pricing | Amber / Yellow | **Partial Coverage**: Core components are priced; some secondary components are missing fields. Use 1-click **⚡ Auto-Fix** to reach 100%. |
| **`< 50%`** | Low Coverage | Red / Rose | **Requires Attention**: Major core components (like VM sizing or DB storage) are unpriced due to missing required inputs. |

---

## 3. Component Pricing Status Badges

Appears on individual service cards in **Step 2: Review services**.

| Badge | Status Key | Icon | Meaning & Guidance |
| :--- | :--- | :--- | :--- |
| **`Ready`** | `supported` | Green Check (`CheckCircle2`) | Service has all required parameters and is included in the cost estimate. |
| **`Need info`** | `needs_review` / `missing_required_fields` | Amber Warning (`TriangleAlert`) | Detected service is missing required parameters (e.g. vCPU count, RAM, Disk size). Click **⚡ Fix & Fill Defaults** or edit values inline. |
| **`Price not ready`** | `not_implemented` | Violet Clock (`Clock3`) | Service is recognized, but live API adapter is under development. Excluded from calculation total to avoid fake numbers. |
| **`Can't price`** | `unsupported` | Slate Alert (`CircleAlert`) | Specialized architecture or proprietary SKU requiring custom enterprise quote review. |

---

## 4. Confidence Level Indicators

Appears on component cards and calculation summaries to indicate data confidence.

| Confidence | Color | Basis & Methodology |
| :--- | :--- | :--- |
| **High** | Emerald Green | Direct match against active public API pricing meters. |
| **Medium** | Amber Yellow | Specification inferred from standard enterprise architectural defaults. |
| **Low** | Rose Red | Broad category estimation based on market average rates. |

---

## 5. Extraction Method Indicators

Appears in the **Step 2: Review services** header bar.

| Indicator | Method | Description |
| :--- | :--- | :--- |
| **`AI-assisted`** | LLM Extraction | Requirements parsed using advanced AI natural language processing. |
| **`Rule-based fallback`** | Pattern Matching | Requirements parsed using local fallback pattern rules when AI is offline. |

---

## 6. How to Fix Unpriced Components

1. **1-Click Auto-Fix**: Click **⚡ Fix & Fill Recommended Defaults** on any card or in the **Readiness & Accuracy Guidelines** modal to populate standard enterprise specs.
2. **Remove Unwanted Items**: Click **🗑️ Remove from Request** to exclude non-essential components from your pricing calculation.
3. **Inline Edit**: Click any card expand arrow and fill missing values directly.
