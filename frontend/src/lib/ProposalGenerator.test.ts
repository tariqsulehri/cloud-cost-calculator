import { describe, expect, it } from 'vitest';
import { ProposalGenerator, type ProposalInput } from './ProposalGenerator';

describe('ProposalGenerator', () => {
  it('generates a comprehensive markdown proposal document', () => {
    const input: ProposalInput = {
      title: 'Cloud Migration Proposal',
      clientName: 'Acme Corp',
      preparedBy: 'Lead Architect',
      requirementsSummary: 'Web cluster with 2 VMs and PostgreSQL DB in US East',
      estimates: [
        {
          provider: 'aws',
          providerLabel: 'AWS',
          region: 'us-east-1',
          monthlyCost: 350,
          annualCost: 4200,
          oneYearRiMonthlyCost: 245,
          threeYearRiMonthlyCost: 175,
          confidence: 'high',
          lineItemsCount: 2,
          lineItems: [
            {
              category: 'Compute',
              serviceName: 'EC2',
              skuName: 'm7i.xlarge',
              monthlyCost: 200,
              assumption: '2x EC2'
            },
            {
              category: 'Database',
              serviceName: 'RDS PostgreSQL',
              skuName: 'db.m7i.xlarge',
              monthlyCost: 150,
              assumption: 'Single-AZ'
            }
          ],
          assumptions: ['Pay-as-you-go pricing']
        },
        {
          provider: 'azure',
          providerLabel: 'Azure',
          region: 'eastus',
          monthlyCost: 320,
          annualCost: 3840,
          oneYearRiMonthlyCost: 224,
          threeYearRiMonthlyCost: 160,
          confidence: 'high',
          lineItemsCount: 2,
          lineItems: [
            {
              category: 'Compute',
              serviceName: 'Virtual Machines',
              skuName: 'Standard_D4s_v5',
              monthlyCost: 180,
              assumption: '2x VM'
            },
            {
              category: 'Database',
              serviceName: 'Flexible Server PostgreSQL',
              skuName: 'D4s_v5',
              monthlyCost: 140,
              assumption: 'Single-AZ'
            }
          ],
          assumptions: ['Pay-as-you-go pricing']
        }
      ]
    };

    const markdown = ProposalGenerator.generateMarkdownProposal(input);

    expect(markdown).toContain('# Cloud Migration Proposal');
    expect(markdown).toContain('**Client**: Acme Corp');
    expect(markdown).toContain('Azure');
    expect(markdown).toContain('AWS');
    expect(markdown).toContain('3-Year Total Cost of Ownership (TCO)');
  });
});
