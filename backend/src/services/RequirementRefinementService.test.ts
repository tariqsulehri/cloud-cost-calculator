import { describe, expect, it } from 'vitest';
import { RequirementRefinementService } from './RequirementRefinementService.js';

describe('RequirementRefinementService', () => {
  it('falls back to an Azure service dictionary and open items when AI refinement is unavailable', async () => {
    const service = new RequirementRefinementService({
      client: {
        responses: {
          async create() {
            throw new Error('AI unavailable');
          }
        }
      }
    });

    const refined = await service.refineRequirements(`I need Kubernetes using AKS in East US.
Each worker node should have 8 vCPU and 32GB RAM.
Use Ubuntu Linux nodes.`);

    expect(refined).toContain('Azure Service Dictionary:');
    expect(refined).toContain('Kubernetes -> Azure Kubernetes Service (AKS)');
    expect(refined).toContain('Azure service: Azure Kubernetes Service (AKS)');
    expect(refined).toContain('Open items to complete before estimate:');
    expect(refined).toContain('AKS worker node count: not specified');
  });

  it('recognizes worker node count with Linux Ubuntu adjectives', async () => {
    const service = new RequirementRefinementService({
      client: {
        responses: {
          async create() {
            throw new Error('AI unavailable');
          }
        }
      }
    });

    const refined = await service.refineRequirements(`Kubernetes cluster: AKS with 4 Linux Ubuntu worker nodes.
Each node: 8 vCPU, 32 GB RAM.
Cluster runtime: 730 hours per month.`);

    expect(refined).toContain('Worker nodes: 4');
    expect(refined).not.toContain('AKS worker node count: not specified');
  });

  it('normalizes common East US aliases during local refinement', async () => {
    const service = new RequirementRefinementService({
      client: {
        responses: {
          async create() {
            throw new Error('AI unavailable');
          }
        }
      }
    });

    for (const region of ['useast', 'us-east', 'us_east', 'eastus']) {
      const refined = await service.refineRequirements(`I need 2 Linux Ubuntu virtual machines in ${region}.
Each VM should have 2 vCPU and 8 GB RAM.
They run 730 hours per month.`);

      expect(refined).toContain('I need infrastructure in Azure East US.');
      expect(refined).not.toContain('Azure region not specified');
    }
  });

  it('uses AWS service dictionary and region wording when AWS is the base provider', async () => {
    const service = new RequirementRefinementService({
      client: {
        responses: {
          async create() {
            throw new Error('AI unavailable');
          }
        }
      }
    });

    const refined = await service.refineRequirements(
      `I need Kubernetes, 2 virtual machines, Redis, PostgreSQL, object storage, and CDN in useast.`,
      'aws'
    );

    expect(refined).toContain('I need infrastructure in AWS US East (N. Virginia).');
    expect(refined).toContain('AWS Service Dictionary:');
    expect(refined).toContain('Kubernetes -> Amazon EKS');
    expect(refined).toContain('VMs / servers -> Amazon EC2');
    expect(refined).toContain('Redis cache -> Amazon ElastiCache for Redis');
    expect(refined).not.toContain('Azure Service Dictionary:');
    expect(refined).not.toContain('Azure Virtual Machines');
  });
});
