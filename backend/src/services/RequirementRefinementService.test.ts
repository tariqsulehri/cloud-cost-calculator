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
});
