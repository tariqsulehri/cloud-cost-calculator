# Public Pricing Accuracy Gap Plan

## Purpose

This document captures the current accuracy position of the cloud cost calculator and the recommended work needed to close the gap against native AWS, Azure, and GCP public pricing calculators.

The goal is not invoice reconciliation. The goal is strong public list-price budget estimation for common application architectures such as monoliths, APIs, microservices, databases, cache, storage, networking, and load balancing.

## Current Accuracy Position

| Option | Expected Accuracy for Public-Price Budget Estimates |
| --- | ---: |
| Native cloud pricing calculators | 90-98% |
| Current app | 75-90% |
| Target after adapter gap work | 90-95%+ |

Native calculators are not 100% invoice-accurate because they still exclude or depend on customer-specific factors such as enterprise discounts, private offers, credits, taxes, negotiated rates, support plans, and actual usage variance.

## Current App Coverage

Based on the current calculator service model:

| Provider | Exact Public-Price Coverage | Usable Coverage |
| --- | ---: | ---: |
| AWS | 12 / 13 services, about 92% | 13 / 13, 100% |
| Azure | 10 / 13 services, about 77% | 11 / 13, about 85% |
| GCP | 5 / 13 services, about 38% | 11 / 13, about 85% |
| Overall | 27 / 39, about 69% exact | 35 / 39, about 90% usable |

Definitions:

- Exact: deterministic adapter backed by public pricing meters.
- Partial: main cost can be calculated, but some add-ons are excluded.
- Planning: mapped, but adapter or usage model needs improvement.
- Unsupported: not calculator-ready yet.

## Gap Summary

The main gap is not lack of public price data. AWS, Azure, and GCP public APIs expose broad public SKU and meter data.

The main gap is:

- Adapter coverage.
- Required usage inputs.
- Meter matching rules.
- Service-specific pricing logic.
- Clear assumptions for excluded add-ons.

## Recommended Work

### 1. Azure Managed Disks Exact Adapter

Add deterministic pricing for Azure managed disks.

Required inputs:

- Disk count.
- Disk size GB.
- Disk tier or performance tier.
- Redundancy where applicable.
- Optional snapshot size.

Expected impact:

- Moves Azure block storage from planning to exact.

### 2. GCP Pub/Sub Adapter

Add exact or near-exact pricing for GCP Pub/Sub.

Required inputs:

- Message count.
- Average payload size.
- Monthly data volume.
- Retention if used.

Expected impact:

- Moves GCP queue from planning to exact or partial.

### 3. Azure and GCP Serverless

Add pricing for serverless workloads.

Azure Functions inputs:

- Execution count.
- GB-seconds.
- Memory allocation.
- Execution duration.

GCP Cloud Functions / Cloud Run inputs:

- Request count.
- vCPU-seconds.
- Memory-seconds.
- Optional minimum instances.

Expected impact:

- Moves Azure and GCP serverless from unsupported to exact or partial.

### 4. GCP Load Balancer and CDN Improvements

Strengthen GCP networking adapters.

Required inputs:

- Forwarding rules.
- Processed GB.
- Cache egress GB.
- Cache fill GB.
- Regional vs global traffic.

Expected impact:

- Moves GCP load balancer and CDN from partial toward exact.

### 5. Networking Add-Ons

Add or strengthen pricing for common networking cost drivers.

Recommended services:

- NAT Gateway.
- Public IP.
- Private endpoint.
- Inter-zone traffic.
- Inter-region traffic.
- Data transfer out by destination.

Expected impact:

- Improves alignment for microservices and production network architectures.

### 6. Database Add-Ons

Expand database calculations beyond base compute and storage.

Recommended inputs:

- Backup storage.
- High availability standby.
- Read replicas.
- IOPS where applicable.
- Storage autoscaling allowance where applicable.

Expected impact:

- Improves alignment for production PostgreSQL and managed database estimates.

### 7. Observability

Strengthen monitoring and logging estimates.

Recommended inputs:

- Log ingestion GB.
- Retention days.
- Metrics volume.
- Custom metrics count.
- Alerting or notification volume where applicable.

Expected impact:

- Improves alignment for production workloads where logs can materially affect monthly cost.

## Recommended Management Statement

The calculator uses official public pricing data and normalized cross-cloud mappings for common application infrastructure. Today it is suitable for public-price budget estimation and cross-cloud comparison. Current alignment with native public calculators is expected to be around 75-90% depending on service mix and input detail.

With the recommended adapter and required-field improvements, the calculator can target 90-95%+ alignment with native public pricing calculators for supported service patterns, assuming the same region, SKU, usage hours, storage, traffic, and configuration inputs.

The calculator is not intended to provide customer-specific invoice accuracy unless future phases add contract pricing, enterprise discounts, credits, taxes, support plans, and actual billing usage imports.

## Implementation Direction

Recommended approach:

1. Keep using local Postgres as the pricing and catalog cache.
2. Sync public cloud prices daily and also allow manual sync from the admin panel.
3. Store service mappings, aliases, required fields, and pricing coverage status in database tables.
4. Keep code-level mappings only as seed or fallback data.
5. Add provider-specific pricing adapters incrementally.
6. Add a coverage report showing exact, partial, planning, and unsupported status by provider and service.
7. Track stale prices and missing meters during sync.

