import { AzurePricingService } from './AzurePricingService.js';
import { roundMoney } from '../utils/money.js';
import type {
  EstimateLineItem,
  EstimateRequest,
  EstimateResponse,
  GenericComponent,
  NormalizedComponentType,
  NormalizedEstimateRequest,
  NormalizedEstimateResponse,
  NotImplementedLineItem,
  UnpricedLineItem
} from '../types/estimate.types.js';

export class EstimateService {
  constructor(private readonly azurePricingService = new AzurePricingService()) {}

  async estimate(request: EstimateRequest): Promise<EstimateResponse> {
    const vmPrice = await this.azurePricingService.getVirtualMachineHourlyPrice({
      region: request.region,
      operatingSystem: request.operatingSystem,
      tier: request.tier,
      instanceSku: request.instanceSku
    });

    const monthlyCost = roundMoney(vmPrice.unitPrice * request.quantity * request.hours);
    const lineItem: EstimateLineItem = {
      category: 'Compute',
      serviceName: 'Virtual Machines',
      skuName: request.instanceSku,
      meterName: vmPrice.meterName,
      quantity: request.quantity,
      hours: request.hours,
      unit: vmPrice.unit,
      unitPrice: vmPrice.unitPrice,
      monthlyCost,
      assumption: `${vmPrice.assumption} Calculation is ${request.quantity} VM(s) x ${request.hours} hour(s) x hourly unit price.`,
      pricingSource: vmPrice.pricingSource,
      confidence: vmPrice.confidence,
      rawProductName: vmPrice.rawProductName,
      rawSkuName: vmPrice.rawSkuName,
      rawMeterName: vmPrice.rawMeterName,
      rawArmRegionName: vmPrice.rawArmRegionName
    };

    return {
      provider: request.provider,
      service: request.service,
      region: request.region,
      currency: 'USD',
      totalMonthlyCost: monthlyCost,
      confidence: lineItem.confidence,
      lineItems: [lineItem],
      assumptions: [
        'Phase 1 supports Azure Virtual Machine pay-as-you-go pricing only.',
        'Only Linux Ubuntu standard-tier VM hourly compute is modeled.',
        'Managed disks, storage, bandwidth, load balancer, databases, Redis, monitoring, and backup are not included in Phase 1.',
        'Estimate uses Azure public retail pay-as-you-go VM pricing from Azure Retail Prices API. Actual pricing may vary based on enterprise agreements, reservations, savings plans, taxes, region, and Azure calculator rounding.',
        lineItem.assumption
      ]
    };
  }

  async estimateNormalized(request: NormalizedEstimateRequest): Promise<NormalizedEstimateResponse> {
    const region = request.requirements.region.providerRegion.azure;
    const calculatedLineItems: EstimateLineItem[] = [];
    const notImplementedLineItems: NotImplementedLineItem[] = [];
    const unsupportedLineItems: UnpricedLineItem[] = [];
    const missingRequiredFieldLineItems: UnpricedLineItem[] = [];
    const pricedComponentIds = new Set<string>();
    const assumptions = [...request.requirements.globalAssumptions];
    const hasKubernetes = request.requirements.components.some((component) => component.type === 'kubernetes');
    const components = request.requirements.components.filter((component) => {
      if (component.type !== 'compute') {
        return true;
      }

      if (hasKubernetes && this.isLikelyDuplicateAksCompute(component)) {
        assumptions.push('Ignored an ambiguous duplicate VM component because AKS worker node compute is priced from the AKS component.');
        return false;
      }

      if (!this.hasExplicitVmComputeEvidence(component)) {
        assumptions.push('Ignored an invalid VM component because its evidence did not explicitly describe VM, virtual machine, or web/app/API server capacity.');
        return false;
      }

      return true;
    });

    for (const component of components) {
      if (component.type === 'compute') {
        if (component.pricingStatus === 'missing_required_fields' || !component.vcpu || !component.memoryGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing compute sizing required for deterministic VM pricing.'));
          continue;
        }

        if (component.pricingStatus === 'unsupported' || component.pricingStatus === 'needs_review') {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, 'Detected compute requirement needs review before pricing.'));
          continue;
        }

        const sku = this.matchVmSkuForSize(component.vcpu, component.memoryGb, 'compute requirement');
        const vmPrice = await this.azurePricingService.getVirtualMachineHourlyPrice({
          region,
          operatingSystem: component.operatingSystem ?? 'linux',
          tier: 'standard',
          instanceSku: sku.instanceSku
        });
        const quantity = component.quantity ?? 1;
        const hours = component.monthlyHours ?? 730;
        const monthlyCost = roundMoney(vmPrice.unitPrice * quantity * hours);

        calculatedLineItems.push({
          category: 'Compute',
          serviceName: 'Virtual Machines',
          skuName: sku.instanceSku,
          meterName: vmPrice.meterName,
          quantity,
          hours,
          unit: vmPrice.unit,
          unitPrice: vmPrice.unitPrice,
          monthlyCost,
          assumption: `${vmPrice.assumption} ${sku.assumption} Calculation is ${quantity} VM(s) x ${hours} hour(s) x hourly unit price.`,
          pricingSource: vmPrice.pricingSource,
          confidence: vmPrice.confidence,
          rawProductName: vmPrice.rawProductName,
          rawSkuName: vmPrice.rawSkuName,
          rawMeterName: vmPrice.rawMeterName,
          rawArmRegionName: vmPrice.rawArmRegionName
        });
        pricedComponentIds.add(component.id);
        assumptions.push(sku.assumption);
      } else if (component.type === 'kubernetes') {
        const nodeCount = this.numberValue(component, 'nodeCount');
        const vcpuPerNode = this.numberValue(component, 'vcpuPerNode');
        const memoryGbPerNode = this.numberValue(component, 'memoryGbPerNode');

        if (!nodeCount || !vcpuPerNode || !memoryGbPerNode) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing AKS worker node count, vCPU, or memory required for node compute pricing.'));
          continue;
        }

        const sku = this.matchVmSkuForSize(vcpuPerNode, memoryGbPerNode, 'AKS worker node requirement');
        const vmPrice = await this.azurePricingService.getVirtualMachineHourlyPrice({
          region,
          operatingSystem: component.operatingSystem === 'linux' ? 'linux' : 'linux',
          tier: 'standard',
          instanceSku: sku.instanceSku
        });
        const hours = this.numberValue(component, 'monthlyHours') ?? 730;
        const monthlyCost = roundMoney(vmPrice.unitPrice * nodeCount * hours);
        const aksAssumption = 'AKS estimate includes worker node VM compute only; AKS control plane, ingress, disks, networking, and managed add-ons are still listed separately when detected.';

        calculatedLineItems.push({
          category: 'Compute',
          serviceName: 'Virtual Machines',
          skuName: sku.instanceSku,
          meterName: vmPrice.meterName,
          quantity: nodeCount,
          hours,
          unit: vmPrice.unit,
          unitPrice: vmPrice.unitPrice,
          monthlyCost,
          assumption: `${vmPrice.assumption} ${sku.assumption} ${aksAssumption} Calculation is ${nodeCount} AKS worker node(s) x ${hours} hour(s) x hourly unit price.`,
          pricingSource: vmPrice.pricingSource,
          confidence: vmPrice.confidence,
          rawProductName: vmPrice.rawProductName,
          rawSkuName: vmPrice.rawSkuName,
          rawMeterName: vmPrice.rawMeterName,
          rawArmRegionName: vmPrice.rawArmRegionName
        });
        pricedComponentIds.add(component.id);
        assumptions.push(sku.assumption, aksAssumption);
      } else if (component.type === 'object_storage') {
        const dataStoredGb = this.numberValue(component, 'dataStoredGb');
        const accessTier = this.stringValue(component, 'accessTier');
        const redundancy = this.stringValue(component, 'redundancy');

        if (!dataStoredGb || !accessTier || !redundancy || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing Blob Storage data stored, access tier, or redundancy required for deterministic pricing.'));
          continue;
        }

        const blobPrice = await this.azurePricingService.getBlobStorageCapacityPrice({
          region,
          accessTier,
          redundancy
        });

        if (blobPrice.pricingSource === 'fallback' || blobPrice.tiers.length === 0) {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, blobPrice.assumption));
          continue;
        }

        const monthlyCost = roundMoney(this.calculateTieredUsageCost(dataStoredGb, blobPrice.tiers));
        const blobAssumption =
          'Blob Storage estimate includes the capacity meter only; read/write operations, lifecycle actions, snapshots, backup, and data transfer are excluded unless separately detected.';

        calculatedLineItems.push({
          category: 'Storage',
          serviceName: blobPrice.serviceName,
          skuName: blobPrice.skuName,
          meterName: blobPrice.meterName,
          quantity: dataStoredGb,
          hours: 1,
          usageLabel: `${this.formatUsage(dataStoredGb)} GB-month`,
          unit: blobPrice.unit,
          unitPrice: blobPrice.unitPrice,
          monthlyCost,
          assumption: `${blobPrice.assumption} ${blobAssumption} Calculation applies Azure tiered storage pricing to ${this.formatUsage(dataStoredGb)} GB-month.`,
          pricingSource: blobPrice.pricingSource,
          confidence: blobPrice.confidence,
          rawProductName: blobPrice.rawProductName,
          rawSkuName: blobPrice.rawSkuName,
          rawMeterName: blobPrice.rawMeterName,
          rawArmRegionName: blobPrice.rawArmRegionName
        });
        pricedComponentIds.add(component.id);
        assumptions.push(blobAssumption);
      } else if (component.type === 'network') {
        const monthlyEgressGb = this.numberValue(component, 'monthlyEgressGb');

        if (!monthlyEgressGb || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing monthly internet egress GB required for deterministic bandwidth pricing.'));
          continue;
        }

        const bandwidthPrice = await this.azurePricingService.getInternetEgressPrice({ region });

        if (bandwidthPrice.pricingSource === 'fallback' || bandwidthPrice.tiers.length === 0) {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, bandwidthPrice.assumption));
          continue;
        }

        const monthlyCost = roundMoney(this.calculateTieredUsageCost(monthlyEgressGb, bandwidthPrice.tiers));
        const bandwidthAssumption =
          'Bandwidth estimate uses standard internet data transfer out over Microsoft global network routing preference; CDN transfer is excluded when modeled as a separate CDN component.';

        calculatedLineItems.push({
          category: 'Networking',
          serviceName: bandwidthPrice.serviceName,
          skuName: bandwidthPrice.skuName,
          meterName: bandwidthPrice.meterName,
          quantity: monthlyEgressGb,
          hours: 1,
          usageLabel: `${this.formatUsage(monthlyEgressGb)} GB egress`,
          unit: bandwidthPrice.unit,
          unitPrice: bandwidthPrice.unitPrice,
          monthlyCost,
          assumption: `${bandwidthPrice.assumption} ${bandwidthAssumption} Calculation applies Azure tiered bandwidth pricing to ${this.formatUsage(monthlyEgressGb)} GB.`,
          pricingSource: bandwidthPrice.pricingSource,
          confidence: bandwidthPrice.confidence,
          rawProductName: bandwidthPrice.rawProductName,
          rawSkuName: bandwidthPrice.rawSkuName,
          rawMeterName: bandwidthPrice.rawMeterName,
          rawArmRegionName: bandwidthPrice.rawArmRegionName
        });
        pricedComponentIds.add(component.id);
        assumptions.push(bandwidthAssumption);
      } else if (component.type === 'cdn') {
        const monthlyTransferGb = component.dataTransferGb ?? component.monthlyTransferGb ?? null;
        const requestCount = component.requestCount ?? null;

        if (!monthlyTransferGb && !requestCount) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing CDN monthly transfer GB or request count required for deterministic CDN pricing.'));
          continue;
        }

        const cdnZone = this.cdnZoneForRegion(region);
        const cdnAssumption =
          'CDN estimate defaults to Azure CDN from Microsoft Standard using Zone 1 pricing for East US. Rules, WAF, custom domains, origin egress, and premium/custom CDN features are excluded unless separately specified.';
        let cdnLinePriced = false;

        if (monthlyTransferGb) {
          const transferPrice = await this.azurePricingService.getCdnStandardMicrosoftDataTransferPrice({ zone: cdnZone });

          if (transferPrice.pricingSource === 'fallback' || transferPrice.tiers.length === 0) {
            unsupportedLineItems.push(this.toUnpricedLineItem(component, transferPrice.assumption));
          } else {
            const monthlyCost = roundMoney(this.calculateTieredUsageCost(monthlyTransferGb, transferPrice.tiers));

            calculatedLineItems.push({
              category: 'Networking',
              serviceName: transferPrice.serviceName,
              skuName: transferPrice.skuName,
              meterName: transferPrice.meterName,
              quantity: monthlyTransferGb,
              hours: 1,
              usageLabel: `${this.formatUsage(monthlyTransferGb)} GB transfer`,
              unit: transferPrice.unit,
              unitPrice: transferPrice.unitPrice,
              monthlyCost,
              assumption: `${transferPrice.assumption} ${cdnAssumption} Calculation applies Azure tiered CDN transfer pricing to ${this.formatUsage(monthlyTransferGb)} GB.`,
              pricingSource: transferPrice.pricingSource,
              confidence: transferPrice.confidence,
              rawProductName: transferPrice.rawProductName,
              rawSkuName: transferPrice.rawSkuName,
              rawMeterName: transferPrice.rawMeterName,
              rawArmRegionName: transferPrice.rawArmRegionName
            });
            cdnLinePriced = true;
          }
        }

        if (requestCount) {
          const requestPrice = await this.azurePricingService.getCdnStandardMicrosoftRequestsPrice({ zone: cdnZone });

          if (requestPrice.pricingSource === 'fallback' || requestPrice.tiers.length === 0) {
            unsupportedLineItems.push(this.toUnpricedLineItem(component, requestPrice.assumption));
          } else {
            const millionRequests = requestCount / 1_000_000;
            const monthlyCost = roundMoney(this.calculateTieredUsageCost(millionRequests, requestPrice.tiers));

            calculatedLineItems.push({
              category: 'Networking',
              serviceName: requestPrice.serviceName,
              skuName: requestPrice.skuName,
              meterName: requestPrice.meterName,
              quantity: millionRequests,
              hours: 1,
              usageLabel: `${this.formatUsage(millionRequests)}M requests`,
              unit: requestPrice.unit,
              unitPrice: requestPrice.unitPrice,
              monthlyCost,
              assumption: `${requestPrice.assumption} ${cdnAssumption} Calculation applies Azure CDN request pricing to ${this.formatUsage(millionRequests)} million requests.`,
              pricingSource: requestPrice.pricingSource,
              confidence: requestPrice.confidence,
              rawProductName: requestPrice.rawProductName,
              rawSkuName: requestPrice.rawSkuName,
              rawMeterName: requestPrice.rawMeterName,
              rawArmRegionName: requestPrice.rawArmRegionName
            });
            cdnLinePriced = true;
          }
        }

        if (cdnLinePriced) {
          pricedComponentIds.add(component.id);
          assumptions.push(cdnAssumption);
        }
      } else if (component.type === 'load_balancer') {
        const scheme = component.scheme;
        const azureServiceHint = component.providerServiceHint.azure ?? '';
        const isApplicationGateway = scheme === 'http_s' || /application gateway/i.test(azureServiceHint);

        if (!scheme) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing load balancer scheme required to choose Application Gateway or Azure Load Balancer pricing.'));
          continue;
        }

        if (!isApplicationGateway) {
          notImplementedLineItems.push({
            componentId: component.id,
            type: component.type,
            serviceName: this.displayServiceName(component),
            reason: 'Azure Load Balancer pricing adapter is not implemented yet; HTTP/S Application Gateway pricing is supported.',
            assumptions: component.assumptions,
            rawText: component.rawText
          });
          continue;
        }

        const fixedPrice = await this.azurePricingService.getApplicationGatewayStandardV2FixedPrice({ region });
        const capacityUnitPrice = await this.azurePricingService.getApplicationGatewayStandardV2CapacityUnitPrice({ region });

        if (fixedPrice.pricingSource === 'fallback') {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, fixedPrice.assumption));
          continue;
        }

        if (capacityUnitPrice.pricingSource === 'fallback') {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, capacityUnitPrice.assumption));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const capacityUnits = this.numberValue(component as unknown as GenericComponent, 'capacityUnits') ?? 1;
        const gatewayAssumption =
          'Application Gateway estimate defaults HTTP/S load balancer or ingress to Standard v2 with 1 gateway and 1 capacity unit. WAF, additional capacity units, private link, public IP, and certificate costs are excluded unless specified.';

        calculatedLineItems.push({
          category: 'Networking',
          serviceName: fixedPrice.serviceName,
          skuName: fixedPrice.skuName,
          meterName: fixedPrice.meterName,
          quantity: 1,
          hours,
          usageLabel: `1 gateway x ${hours} hours`,
          unit: fixedPrice.unit,
          unitPrice: fixedPrice.unitPrice,
          monthlyCost: roundMoney(fixedPrice.unitPrice * hours),
          assumption: `${fixedPrice.assumption} ${gatewayAssumption} Calculation is 1 gateway x ${hours} hour(s) x hourly fixed price.`,
          pricingSource: fixedPrice.pricingSource,
          confidence: fixedPrice.confidence,
          rawProductName: fixedPrice.rawProductName,
          rawSkuName: fixedPrice.rawSkuName,
          rawMeterName: fixedPrice.rawMeterName,
          rawArmRegionName: fixedPrice.rawArmRegionName
        });

        calculatedLineItems.push({
          category: 'Networking',
          serviceName: capacityUnitPrice.serviceName,
          skuName: capacityUnitPrice.skuName,
          meterName: capacityUnitPrice.meterName,
          quantity: capacityUnits,
          hours,
          usageLabel: `${capacityUnits} capacity unit x ${hours} hours`,
          unit: capacityUnitPrice.unit,
          unitPrice: capacityUnitPrice.unitPrice,
          monthlyCost: roundMoney(capacityUnitPrice.unitPrice * capacityUnits * hours),
          assumption: `${capacityUnitPrice.assumption} ${gatewayAssumption} Calculation is ${capacityUnits} capacity unit(s) x ${hours} hour(s) x hourly capacity unit price.`,
          pricingSource: capacityUnitPrice.pricingSource,
          confidence: capacityUnitPrice.confidence,
          rawProductName: capacityUnitPrice.rawProductName,
          rawSkuName: capacityUnitPrice.rawSkuName,
          rawMeterName: capacityUnitPrice.rawMeterName,
          rawArmRegionName: capacityUnitPrice.rawArmRegionName
        });

        pricedComponentIds.add(component.id);
        assumptions.push(gatewayAssumption);
      } else if (component.type === 'cache') {
        const memoryGb = component.memoryGb;
        const tier = component.tier;

        if (!memoryGb || !tier || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing Redis memory or tier required for deterministic cache pricing.'));
          continue;
        }

        const redisPrice = await this.azurePricingService.getRedisCacheHourlyPrice({
          region,
          memoryGb,
          tier
        });

        if (redisPrice.pricingSource === 'fallback') {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, redisPrice.assumption));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const monthlyCost = roundMoney(redisPrice.unitPrice * hours);
        const redisAssumption =
          'Redis estimate prices one cache instance/SKU selected from requested memory and tier; network bandwidth, clustering, persistence, and enterprise-only features are excluded.';

        calculatedLineItems.push({
          category: 'Cache',
          serviceName: redisPrice.serviceName,
          skuName: redisPrice.skuName,
          meterName: redisPrice.meterName,
          quantity: 1,
          hours,
          usageLabel: `1 x ${hours} hours`,
          unit: redisPrice.unit,
          unitPrice: redisPrice.unitPrice,
          monthlyCost,
          assumption: `${redisPrice.assumption} ${redisAssumption} Calculation is 1 cache x ${hours} hour(s) x hourly unit price.`,
          pricingSource: redisPrice.pricingSource,
          confidence: redisPrice.confidence,
          rawProductName: redisPrice.rawProductName,
          rawSkuName: redisPrice.rawSkuName,
          rawMeterName: redisPrice.rawMeterName,
          rawArmRegionName: redisPrice.rawArmRegionName
        });
        pricedComponentIds.add(component.id);
        assumptions.push(redisAssumption);
      } else if (component.type === 'queue') {
        const tier = this.stringValue(component, 'tier');
        const messageVolume = this.numberValue(component, 'messageVolume');

        if (!tier || !messageVolume || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing Service Bus tier or monthly message volume required for deterministic messaging pricing.'));
          continue;
        }

        const normalizedTier = tier.toLowerCase();
        const serviceBusAssumption =
          'Service Bus estimate prices the selected tier and messaging operations only; brokered connections, relay, geo-replication, private endpoints, and premium extra messaging units are excluded unless specified.';

        if (normalizedTier === 'premium') {
          const premiumPrice = await this.azurePricingService.getServiceBusBasePrice({ region, tier: 'premium' });
          if (premiumPrice.pricingSource === 'fallback') {
            unsupportedLineItems.push(this.toUnpricedLineItem(component, premiumPrice.assumption));
            continue;
          }

          const messagingUnits = this.numberValue(component, 'messagingUnits') ?? 1;
          const hours = this.numberValue(component, 'monthlyHours') ?? 730;
          const monthlyCost = roundMoney(premiumPrice.unitPrice * messagingUnits * hours);

          calculatedLineItems.push({
            category: 'Integration',
            serviceName: premiumPrice.serviceName,
            skuName: premiumPrice.skuName,
            meterName: premiumPrice.meterName,
            quantity: messagingUnits,
            hours,
            usageLabel: `${messagingUnits} messaging unit x ${hours} hours`,
            unit: premiumPrice.unit,
            unitPrice: premiumPrice.unitPrice,
            monthlyCost,
            assumption: `${premiumPrice.assumption} ${serviceBusAssumption} Calculation is ${messagingUnits} premium messaging unit(s) x ${hours} hour(s) x hourly unit price.`,
            pricingSource: premiumPrice.pricingSource,
            confidence: premiumPrice.confidence,
            rawProductName: premiumPrice.rawProductName,
            rawSkuName: premiumPrice.rawSkuName,
            rawMeterName: premiumPrice.rawMeterName,
            rawArmRegionName: premiumPrice.rawArmRegionName
          });
        } else {
          if (normalizedTier === 'standard') {
            const basePrice = await this.azurePricingService.getServiceBusBasePrice({ region, tier: 'standard' });
            if (basePrice.pricingSource === 'fallback') {
              unsupportedLineItems.push(this.toUnpricedLineItem(component, basePrice.assumption));
              continue;
            }

            calculatedLineItems.push({
              category: 'Integration',
              serviceName: basePrice.serviceName,
              skuName: basePrice.skuName,
              meterName: basePrice.meterName,
              quantity: 1,
              hours: 1,
              usageLabel: '1 month',
              unit: basePrice.unit,
              unitPrice: basePrice.unitPrice,
              monthlyCost: roundMoney(basePrice.unitPrice),
              assumption: `${basePrice.assumption} ${serviceBusAssumption}`,
              pricingSource: basePrice.pricingSource,
              confidence: basePrice.confidence,
              rawProductName: basePrice.rawProductName,
              rawSkuName: basePrice.rawSkuName,
              rawMeterName: basePrice.rawMeterName,
              rawArmRegionName: basePrice.rawArmRegionName
            });
          }

          const operationsPrice = await this.azurePricingService.getServiceBusOperationsPrice({ region, tier: normalizedTier });
          if (operationsPrice.pricingSource === 'fallback' || operationsPrice.tiers.length === 0) {
            unsupportedLineItems.push(this.toUnpricedLineItem(component, operationsPrice.assumption));
            continue;
          }

          const millionOperations = messageVolume / 1_000_000;
          const monthlyCost = roundMoney(this.calculateTieredUsageCost(millionOperations, operationsPrice.tiers));

          calculatedLineItems.push({
            category: 'Integration',
            serviceName: operationsPrice.serviceName,
            skuName: operationsPrice.skuName,
            meterName: operationsPrice.meterName,
            quantity: millionOperations,
            hours: 1,
            usageLabel: `${this.formatUsage(millionOperations)}M operations`,
            unit: operationsPrice.unit,
            unitPrice: operationsPrice.unitPrice,
            monthlyCost,
            assumption: `${operationsPrice.assumption} ${serviceBusAssumption} Calculation applies Azure tiered operations pricing to ${this.formatUsage(millionOperations)} million operations.`,
            pricingSource: operationsPrice.pricingSource,
            confidence: operationsPrice.confidence,
            rawProductName: operationsPrice.rawProductName,
            rawSkuName: operationsPrice.rawSkuName,
            rawMeterName: operationsPrice.rawMeterName,
            rawArmRegionName: operationsPrice.rawArmRegionName
          });
        }

        pricedComponentIds.add(component.id);
        assumptions.push(serviceBusAssumption);
      } else if (component.type === 'monitoring') {
        const logIngestionGb = this.numberValue(component, 'logIngestionGb');
        const retentionDays = this.numberValue(component, 'retentionDays') ?? 31;

        if (!logIngestionGb || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing Log Analytics ingestion GB required for deterministic monitoring pricing.'));
          continue;
        }

        const ingestionPrice = await this.azurePricingService.getLogAnalyticsIngestionPrice({ region });
        if (ingestionPrice.pricingSource === 'fallback' || ingestionPrice.tiers.length === 0) {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, ingestionPrice.assumption));
          continue;
        }

        const ingestionCost = roundMoney(this.calculateTieredUsageCost(logIngestionGb, ingestionPrice.tiers));
        const monitorAssumption =
          'Log Analytics estimate includes analytics logs ingestion and retention beyond 31 days only; alerts, metrics, Sentinel, data export, and workspace transformations are excluded.';

        calculatedLineItems.push({
          category: 'Management',
          serviceName: ingestionPrice.serviceName,
          skuName: ingestionPrice.skuName,
          meterName: ingestionPrice.meterName,
          quantity: logIngestionGb,
          hours: 1,
          usageLabel: `${this.formatUsage(logIngestionGb)} GB ingested`,
          unit: ingestionPrice.unit,
          unitPrice: ingestionPrice.unitPrice,
          monthlyCost: ingestionCost,
          assumption: `${ingestionPrice.assumption} ${monitorAssumption} Calculation applies Azure tiered ingestion pricing to ${this.formatUsage(logIngestionGb)} GB.`,
          pricingSource: ingestionPrice.pricingSource,
          confidence: ingestionPrice.confidence,
          rawProductName: ingestionPrice.rawProductName,
          rawSkuName: ingestionPrice.rawSkuName,
          rawMeterName: ingestionPrice.rawMeterName,
          rawArmRegionName: ingestionPrice.rawArmRegionName
        });

        const extraRetentionDays = Math.max(0, retentionDays - 31);
        if (extraRetentionDays > 0) {
          const retentionPrice = await this.azurePricingService.getLogAnalyticsRetentionPrice({ region });
          if (retentionPrice.pricingSource === 'fallback' || retentionPrice.tiers.length === 0) {
            unsupportedLineItems.push(this.toUnpricedLineItem(component, retentionPrice.assumption));
            continue;
          }

          const retainedGbMonth = (logIngestionGb * extraRetentionDays) / 30;
          const retentionCost = roundMoney(this.calculateTieredUsageCost(retainedGbMonth, retentionPrice.tiers));

          calculatedLineItems.push({
            category: 'Management',
            serviceName: retentionPrice.serviceName,
            skuName: retentionPrice.skuName,
            meterName: retentionPrice.meterName,
            quantity: retainedGbMonth,
            hours: 1,
            usageLabel: `${this.formatUsage(retainedGbMonth)} GB-month retained`,
            unit: retentionPrice.unit,
            unitPrice: retentionPrice.unitPrice,
            monthlyCost: retentionCost,
            assumption: `${retentionPrice.assumption} ${monitorAssumption} Calculation estimates ${extraRetentionDays} retention day(s) beyond the included 31 days.`,
            pricingSource: retentionPrice.pricingSource,
            confidence: retentionPrice.confidence,
            rawProductName: retentionPrice.rawProductName,
            rawSkuName: retentionPrice.rawSkuName,
            rawMeterName: retentionPrice.rawMeterName,
            rawArmRegionName: retentionPrice.rawArmRegionName
          });
        }

        pricedComponentIds.add(component.id);
        assumptions.push(monitorAssumption);
      } else if (component.type === 'database') {
        const vcpu = component.vcpu;
        const storageGb = component.storageGb;
        const highAvailabilityKnown = component.highAvailability !== null && component.highAvailability !== undefined;

        if (component.engine !== 'postgresql' || !vcpu || !storageGb || !highAvailabilityKnown || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing PostgreSQL engine, vCPU, storage, or high availability setting required for deterministic database pricing.'));
          continue;
        }

        const computePrice = await this.azurePricingService.getPostgresFlexibleServerComputePrice({ region, vcpu });
        const storagePrice = await this.azurePricingService.getPostgresFlexibleServerStoragePrice({ region });

        if (computePrice.pricingSource === 'fallback') {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, computePrice.assumption));
          continue;
        }

        if (storagePrice.pricingSource === 'fallback') {
          unsupportedLineItems.push(this.toUnpricedLineItem(component, storagePrice.assumption));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const computeQuantity = component.highAvailability === true ? 2 : 1;
        const computeMonthlyCost = roundMoney(computePrice.unitPrice * computeQuantity * hours);
        const storageMonthlyCost = roundMoney(storagePrice.unitPrice * storageGb);
        const postgresAssumption =
          'PostgreSQL estimate defaults to Flexible Server General Purpose Ddsv5 matching requested vCPU. Zone-redundant HA doubles compute for a standby server. Backup overage, IOPS, private networking, and read replicas are excluded.';

        calculatedLineItems.push({
          category: 'Database',
          serviceName: computePrice.serviceName,
          skuName: computePrice.skuName,
          meterName: computePrice.meterName,
          quantity: computeQuantity,
          hours,
          usageLabel: `${computeQuantity} server${computeQuantity > 1 ? 's' : ''} x ${hours} hours`,
          unit: computePrice.unit,
          unitPrice: computePrice.unitPrice,
          monthlyCost: computeMonthlyCost,
          assumption: `${computePrice.assumption} ${postgresAssumption} Calculation is ${computeQuantity} server(s) x ${hours} hour(s) x hourly unit price.`,
          pricingSource: computePrice.pricingSource,
          confidence: computePrice.confidence,
          rawProductName: computePrice.rawProductName,
          rawSkuName: computePrice.rawSkuName,
          rawMeterName: computePrice.rawMeterName,
          rawArmRegionName: computePrice.rawArmRegionName
        });

        calculatedLineItems.push({
          category: 'Database',
          serviceName: storagePrice.serviceName,
          skuName: storagePrice.skuName,
          meterName: storagePrice.meterName,
          quantity: storageGb,
          hours: 1,
          usageLabel: `${this.formatUsage(storageGb)} GB-month`,
          unit: storagePrice.unit,
          unitPrice: storagePrice.unitPrice,
          monthlyCost: storageMonthlyCost,
          assumption: `${storagePrice.assumption} ${postgresAssumption} Calculation is ${this.formatUsage(storageGb)} GB-month x storage unit price.`,
          pricingSource: storagePrice.pricingSource,
          confidence: storagePrice.confidence,
          rawProductName: storagePrice.rawProductName,
          rawSkuName: storagePrice.rawSkuName,
          rawMeterName: storagePrice.rawMeterName,
          rawArmRegionName: storagePrice.rawArmRegionName
        });

        pricedComponentIds.add(component.id);
        assumptions.push(postgresAssumption);
      } else if (component.pricingStatus === 'missing_required_fields') {
        missingRequiredFieldLineItems.push(this.toUnpricedLineItem(component, 'Missing required fields for deterministic pricing.'));
      } else if (component.pricingStatus === 'unsupported' || component.pricingStatus === 'needs_review') {
        unsupportedLineItems.push(this.toUnpricedLineItem(component, 'Detected service cannot be mapped confidently for pricing.'));
      } else {
        notImplementedLineItems.push({
          componentId: component.id,
          type: component.type,
          serviceName: this.displayServiceName(component),
          reason: 'Detected but pricing not implemented yet.',
          assumptions: component.assumptions,
          rawText: component.rawText
        });
      }
    }

    const estimateQuality = this.estimateQuality({
      totalComponentCount: components.length,
      pricedComponentCount: pricedComponentIds.size,
      reviewItems: [...notImplementedLineItems, ...unsupportedLineItems, ...missingRequiredFieldLineItems]
    });

    return {
      provider: request.provider,
      region,
      currency: 'USD',
      totalMonthlyCost: roundMoney(calculatedLineItems.reduce((sum, item) => sum + item.monthlyCost, 0)),
      estimateQuality,
      calculatedLineItems,
      notImplementedLineItems,
      unsupportedLineItems,
      missingRequiredFieldLineItems,
      assumptions: [
        ...new Set([
          ...assumptions,
          estimateQuality.summary,
          'Only calculated Azure Retail Prices API line items are included in the total. Detected services without implemented pricing are excluded instead of estimated with fake values.',
          'Actual pricing may vary based on enterprise agreements, reservations, savings plans, taxes, region, and Azure calculator rounding.'
        ])
      ],
      clarifyingQuestions: request.requirements.clarifyingQuestions
    };
  }

  private matchVmSkuForSize(vcpu: number, memoryGb: number, requirementLabel: string): { instanceSku: string; assumption: string } {
    if (vcpu === 4 && memoryGb === 16) {
      return {
        instanceSku: 'D4s v5',
        assumption: `Matched 4 vCPU and 16 GB RAM ${requirementLabel} to D4s v5 / Standard_D4s_v5.`
      };
    }

    if (vcpu === 8 && memoryGb === 32) {
      return {
        instanceSku: 'D8s v5',
        assumption: `Matched 8 vCPU and 32 GB RAM ${requirementLabel} to D8s v5 / Standard_D8s_v5.`
      };
    }

    if (vcpu === 2 && memoryGb === 4) {
      return {
        instanceSku: 'B2als v2',
        assumption: `Matched 2 vCPU and 4 GB RAM ${requirementLabel} to B2als v2 / Standard_B2als_v2.`
      };
    }

    return {
      instanceSku: 'D4s v5',
      assumption: `No exact VM SKU rule matched; defaulted ${requirementLabel} to D4s v5 for pricing review.`
    };
  }

  private numberValue(component: GenericComponent, field: string): number | null {
    const value = component[field];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private stringValue(component: GenericComponent, field: string): string | null {
    const value = component[field];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private calculateTieredUsageCost(quantity: number, tiers: Array<{ tierMinimumUnits: number; unitPrice: number }>): number {
    const sorted = [...tiers].sort((a, b) => a.tierMinimumUnits - b.tierMinimumUnits);
    return sorted.reduce((sum, tier, index) => {
      const nextTier = sorted[index + 1];
      const tierStart = tier.tierMinimumUnits;

      if (quantity <= tierStart) {
        return sum;
      }

      const tierEnd = nextTier ? Math.min(quantity, nextTier.tierMinimumUnits) : quantity;
      const tierQuantity = Math.max(0, tierEnd - tierStart);
      return sum + tierQuantity * tier.unitPrice;
    }, 0);
  }

  private formatUsage(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  private cdnZoneForRegion(region: string): string {
    return region === 'eastus' ? 'Zone 1' : 'Zone 1';
  }

  private toUnpricedLineItem(
    component: { id: string; type: NormalizedComponentType; name?: string; providerServiceHint?: { azure: string | null }; assumptions: string[]; rawText?: string },
    reason: string
  ): UnpricedLineItem {
    return {
      componentId: component.id,
      type: component.type,
      serviceName: this.displayServiceName(component),
      reason,
      assumptions: component.assumptions,
      rawText: component.rawText
    };
  }

  private isLikelyDuplicateAksCompute(component: { role?: string | null; rawText?: string; name?: string }): boolean {
    const evidence = `${component.rawText ?? ''} ${component.role ?? ''}`.toLowerCase();
    const explicitStandaloneCompute = /\b(web servers?|app servers?|application servers?|api servers?|virtual machines?)\b/i.test(evidence);
    const aksEvidence = /\b(aks|kubernetes|worker nodes?|node size|cluster size)\b/i.test(evidence);
    return aksEvidence && !explicitStandaloneCompute;
  }

  private hasExplicitVmComputeEvidence(component: { role?: string | null; rawText?: string }): boolean {
    const evidence = `${component.rawText ?? ''} ${component.role ?? ''}`.toLowerCase();
    return /\b(virtual machines?|vms|web servers?|app servers?|application servers?|api servers?)\b/i.test(evidence) || /\b(\d+(?:\.\d+)?)\s+vm\b/i.test(evidence) || /\b(each|per)\s+vm\b/i.test(evidence);
  }

  private estimateQuality({
    totalComponentCount,
    pricedComponentCount,
    reviewItems
  }: {
    totalComponentCount: number;
    pricedComponentCount: number;
    reviewItems: Array<{ serviceName: string; reason: string }>;
  }): NormalizedEstimateResponse['estimateQuality'] {
    const coveragePercent = totalComponentCount === 0 ? 0 : Math.round((pricedComponentCount / totalComponentCount) * 100);
    const blockers = reviewItems.map((item) => `${item.serviceName}: ${item.reason}`);
    const status = totalComponentCount === 0 || pricedComponentCount === 0 ? 'blocked' : blockers.length > 0 ? 'partial' : 'complete';
    const summary =
      status === 'complete'
        ? `Base estimate complete: ${pricedComponentCount}/${totalComponentCount} detected services are priced. Review scope notes for excluded Azure meters.`
        : status === 'partial'
          ? `Partial estimate: ${pricedComponentCount}/${totalComponentCount} detected services are priced. Total includes calculated line items only; unpriced services are excluded.`
          : `Blocked estimate: ${pricedComponentCount}/${totalComponentCount} detected services are priced. Complete missing fields or pricing adapters before using this as a cost estimate.`;

    return {
      status,
      coveragePercent,
      pricedComponentCount,
      totalComponentCount,
      summary,
      blockers
    };
  }

  private displayServiceName(component: { type: NormalizedComponentType; name?: string; providerServiceHint?: { azure: string | null } }): string {
    return component.providerServiceHint?.azure || component.name || this.serviceNameFor(component.type);
  }

  private serviceNameFor(type: NormalizedComponentType): string {
    const names: Record<NormalizedComponentType, string> = {
      compute: 'Azure Virtual Machines',
      database: 'Azure Database for PostgreSQL Flexible Server',
      cache: 'Azure Cache for Redis',
      storage: 'Azure Storage',
      object_storage: 'Azure Blob Storage',
      block_storage: 'Azure Managed Disks',
      file_storage: 'Azure Files',
      cdn: 'Azure CDN',
      load_balancer: 'Azure Application Gateway / Azure Load Balancer',
      kubernetes: 'Azure Kubernetes Service (AKS)',
      serverless: 'Azure Functions',
      queue: 'Azure Service Bus',
      monitoring: 'Azure Monitor / Log Analytics',
      backup: 'Azure Backup',
      security: 'Microsoft Defender for Cloud',
      network: 'Azure Network',
      unknown: 'Unknown service'
    };
    return names[type];
  }
}
