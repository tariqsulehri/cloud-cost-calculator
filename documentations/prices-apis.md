# Public Cloud Price APIs

This document lists the public pricing files and APIs used for cloud cost catalog syncs.

## AWS Price List Bulk API

AWS public price list files do not require sign-in. Use the `current` URLs for daily syncs so the latest published public prices are fetched each time.

Base URL:

```text
https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws
```

Service index:

```text
https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/index.json
```

The service index lists available AWS offer codes and their current version metadata.

### Required AWS Files

| Service | Offer code | URL | Details |
| --- | --- | --- | --- |
| EC2 compute, EBS, data transfer meters inside EC2 offer | `AmazonEC2` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/us-east-1/index.json` | Main file for EC2 Linux on-demand instance pricing in `us-east-1`. This is the file currently downloaded as `data/aws-prices.json`. |
| RDS databases | `AmazonRDS` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/us-east-1/index.json` | Required for Amazon RDS PostgreSQL compute and storage pricing. |
| S3 object storage | `AmazonS3` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/us-east-1/index.json` | Required for S3 storage, requests, and retrieval pricing. |
| CloudFront CDN | `AmazonCloudFront` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudFront/current/index.json` | Required for CloudFront CDN transfer and request pricing. CloudFront is priced from edge-location/global meters rather than a normal AWS region file. |
| Elastic Load Balancing | `AWSELB` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSELB/current/us-east-1/index.json` | Required for Application Load Balancer and Network Load Balancer pricing. |
| ElastiCache Redis | `AmazonElastiCache` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonElastiCache/current/us-east-1/index.json` | Required for Redis cache node pricing. |
| CloudWatch monitoring and logs | `AmazonCloudWatch` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudWatch/current/us-east-1/index.json` | Required for log ingestion, metrics, alarms, and monitoring pricing. |
| SQS queues | `AWSQueueService` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSQueueService/current/us-east-1/index.json` | Required for Amazon SQS request pricing. |
| Data transfer | `AWSDataTransfer` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSDataTransfer/current/us-east-1/index.json` | Required for AWS internet egress and transfer pricing when not covered by service-specific files. |
| AWS Backup | `AWSBackup` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSBackup/current/us-east-1/index.json` | Required for protected data and backup storage pricing. |
| Lambda serverless | `AWSLambda` | `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSLambda/current/us-east-1/index.json` | Required for Lambda requests, duration, and provisioned concurrency pricing. |

Each offer also has a region index. Use it when adding regions beyond `us-east-1`:

```text
https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/{OFFER_CODE}/current/region_index.json
```

### AWS JSON Shape

The AWS files use this high-level structure:

```json
{
  "formatVersion": "v1.0",
  "offerCode": "AmazonEC2",
  "version": "20260617170145",
  "publicationDate": "2026-06-17T17:01:45Z",
  "products": {
    "SKU": {
      "sku": "SKU",
      "productFamily": "Compute Instance",
      "attributes": {}
    }
  },
  "terms": {
    "OnDemand": {
      "SKU": {
        "TERM_CODE": {
          "priceDimensions": {
            "RATE_CODE": {
              "unit": "Hrs",
              "pricePerUnit": {
                "USD": "0.2016000000"
              }
            }
          }
        }
      }
    }
  }
}
```

For public on-demand estimates, ingest only `terms.OnDemand` first. Reserved Instances, Savings Plans, Spot, private discounts, taxes, and customer-specific agreements are not included in these public files.

## Azure Retail Prices API

Azure public retail pricing can be queried with filters.

Base URL:

```text
https://prices.azure.com/api/retail/prices
```

Example VM query:

```text
https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&currencyCode='USD'&$filter=serviceName eq 'Virtual Machines' and armRegionName eq 'eastus' and priceType eq 'Consumption'
```

The current backend already supports Azure Retail Prices API lookups and catalog syncs.

## Google Cloud Billing Pricing API

Google Cloud public pricing is exposed through the Cloud Billing Pricing API. Unlike AWS and Azure public price endpoints, Google requires caller identity for these public endpoints. Configure either an API key or a short-lived OAuth access token in the backend environment before running GCP syncs:

```text
GCP_BILLING_API_KEY=your_api_key
GCP_BILLING_ACCESS_TOKEN=optional_short_lived_oauth_token
```

Do not commit these values. Keep them in `backend/.env` or the deployment platform secret store.

Current project/API enablement URL used during setup:

```text
https://console.developers.google.com/apis/api/cloudbilling.googleapis.com/overview?project=653389506096
```

Console setup checklist:

| Setting | Required value for local sync |
| --- | --- |
| API | Cloud Billing API enabled for project `653389506096` |
| API key application restrictions | `None` for local backend/CLI testing |
| API key API restrictions | `Don't restrict key` for first validation; later restrict to Cloud Billing API if Google allows the pricing methods |
| Backend env | `GCP_BILLING_API_KEY` set in `backend/.env` |

If API-key access is blocked by Google or organization policy, use OAuth:

```bash
export GCP_BILLING_ACCESS_TOKEN="$(gcloud auth print-access-token)"
```

Base URL:

```text
https://cloudbilling.googleapis.com/v2beta
```

Public services:

```text
GET https://cloudbilling.googleapis.com/v2beta/services?pageSize=5000&key={GCP_BILLING_API_KEY}
```

Public SKUs for one service:

```text
GET https://cloudbilling.googleapis.com/v2beta/skus?pageSize=5000&filter=service%20%3D%20%22services%2F{SERVICE_ID}%22&key={GCP_BILLING_API_KEY}
```

Latest public price for one SKU:

```text
GET https://cloudbilling.googleapis.com/v2beta/skus/{SKU_ID}/price?currencyCode=USD&key={GCP_BILLING_API_KEY}
```

All latest public prices can also be paged with:

```text
GET https://cloudbilling.googleapis.com/v2beta/skus/-/prices?pageSize=5000&currencyCode=USD&key={GCP_BILLING_API_KEY}
```

The current backend GCP sync uses services + service-filtered SKUs + per-SKU latest price calls so normalized rows retain service, SKU, product taxonomy, region taxonomy, unit, tier, and list-price context. For Compute Engine, the sync filters noisy SKUs before requesting prices so local estimates avoid licensing, commitment, spot/preemptible, suspended VM state, sole tenancy, and extended-RAM meters.

### Current GCP Implementation Status

| Area | Status |
| --- | --- |
| Public price source | Google Cloud Billing Pricing API `v2beta` |
| Local storage | Postgres `retail_price_meters` with provider `gcp` |
| Admin sync API | `POST /api/catalog/sync/gcp-public-prices/all` |
| Status API | `GET /api/catalog/sync/gcp-public-prices/status` |
| Working adapter | Compute Engine public core/RAM pricing for VM and GKE worker node shapes |
| Fallback behavior | Other GCP services continue using the planning rate card until service-specific SKU matching is added |
| Verified local catalog | Compute Engine `us-east1`, 103 synced meter rows |
| Verified smoke price | N2 4 vCPU / 16 GB shape = `$0.194236/hour`, source `gcp-cloud-billing-pricing-api`, high confidence |

## Sync Direction

Use the same sync service from both triggers:

| Trigger | Purpose |
| --- | --- |
| Admin button | Manual sync and verification. Best first step. |
| Daily cron job | Automatic refresh after the parser and sync result are stable. |

The sync should write normalized rows to `retail_price_meters` and keep original AWS/Azure/GCP source records in `raw_json` for debugging and audit.

## Local Sync Commands

The backend AWS sync script can pull directly from AWS public URLs, so a daily cron does not need to keep JSON files on disk:

```bash
cd backend
npm run catalog:sync:aws:pg -- --offer=AmazonEC2 --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AmazonRDS --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AmazonS3 --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AmazonCloudFront --region=us-east-1 --sourceUrl=https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudFront/current/index.json
npm run catalog:sync:aws:pg -- --offer=AmazonElastiCache --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AmazonCloudWatch --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AWSQueueService --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AWSDataTransfer --region=us-east-1
npm run catalog:sync:aws:pg -- --offer=AWSLambda --region=us-east-1
```

For manual recovery or audit replays, pass `--file=/path/to/aws-offer.json` to ingest a local AWS offer file instead.

Azure supported services:

```bash
cd backend
npm run catalog:sync:azure:all
npm run catalog:sync:azure:pg -- "--service=Virtual Machines" --region=eastus
```

GCP supported services require `GCP_BILLING_API_KEY`:

```bash
cd backend
npm run catalog:sync:gcp:all
npm run catalog:sync:gcp:pg -- "--service=Compute Engine" --region=us-east1
```

Recommended bounded validation command:

```bash
cd backend
npm run catalog:sync:gcp:pg -- "--service=Compute Engine" --region=us-east1 --maxSkus=20
```

Expected successful result shape:

```json
{
  "status": "completed",
  "serviceName": "Compute Engine",
  "regionCode": "us-east1",
  "skusRead": 16,
  "rowsUpserted": 48
}
```

Useful local smoke check after sync:

```bash
cd backend
node -e "import('./dist/services/GcpPricingService.js').then(async ({GcpPricingService})=>{const svc=new GcpPricingService(); const price=await svc.getComputeEngineShapeHourlyPrice({region:'us-east1',vcpu:4,memoryGb:16}); console.log(price);})"
```
