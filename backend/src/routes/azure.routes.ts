import { Router } from 'express';
import type { AzureRegion } from '../types/azure.types.js';

export const azureRegions: AzureRegion[] = [
  { name: 'East US', value: 'eastus' },
  { name: 'East US 2', value: 'eastus2' },
  { name: 'West US', value: 'westus' },
  { name: 'West US 2', value: 'westus2' },
  { name: 'Central US', value: 'centralus' },
  { name: 'West Europe', value: 'westeurope' },
  { name: 'North Europe', value: 'northeurope' },
  { name: 'UK South', value: 'uksouth' },
  { name: 'Southeast Asia', value: 'southeastasia' },
  { name: 'Australia East', value: 'australiaeast' }
];

export function isSupportedAzureRegion(region: string): boolean {
  return azureRegions.some((candidate) => candidate.value === region);
}

export const azureRouter = Router();

azureRouter.get('/azure/regions', (_req, res) => {
  res.json(azureRegions);
});

azureRouter.get('/azure/vm-options', (_req, res) => {
  res.json({
    operatingSystems: [{ label: 'Linux', value: 'linux' }],
    imageTypes: [{ label: 'Ubuntu', value: 'ubuntu' }],
    tiers: [{ label: 'Standard', value: 'standard' }],
    categories: [{ label: 'All', value: 'all' }],
    instanceSeries: [
      {
        label: 'Basv2-series',
        value: 'Basv2-series',
        instances: [
          {
            label: 'B2als v2: 2 vCPUs, 4 GB RAM',
            value: 'B2als v2',
            alternateSku: 'Standard_B2als_v2'
          }
        ]
      },
      {
        label: 'Bsv2-series',
        value: 'Bsv2-series',
        instances: [
          {
            label: 'B2s v2: 2 vCPUs, 4 GB RAM',
            value: 'B2s v2',
            alternateSku: 'Standard_B2s_v2'
          }
        ]
      },
      {
        label: 'Dsv5-series',
        value: 'Dsv5-series',
        instances: [
          {
            label: 'D2s v5: 2 vCPUs, 8 GB RAM',
            value: 'D2s v5',
            alternateSku: 'Standard_D2s_v5'
          },
          {
            label: 'D4s v5: 4 vCPUs, 16 GB RAM',
            value: 'D4s v5',
            alternateSku: 'Standard_D4s_v5'
          }
        ]
      }
    ]
  });
});
