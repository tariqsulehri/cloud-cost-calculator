import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalculationCompletedModal } from './CalculationCompletedModal';
import type { NaturalLanguageEstimateResponse } from '../types/estimate';

describe('CalculationCompletedModal', () => {
  const dummyEstimate: NaturalLanguageEstimateResponse = {
    provider: 'azure',
    region: 'eastus',
    currency: 'USD',
    totalMonthlyCost: 314.88,
    confidence: 'high',
    estimateQuality: {
      status: 'complete',
      coveragePercent: 100,
      pricedComponentCount: 3,
      totalComponentCount: 3,
      summary: 'All components priced',
      blockers: []
    },
    calculatedLineItems: [],
    notImplementedLineItems: [],
    unsupportedLineItems: [],
    missingRequiredFieldLineItems: [],
    assumptions: ['Matched Azure Retail Prices API pay-as-you-go Linux VM hourly price.'],
    clarifyingQuestions: []
  };

  it('renders completion modal with calculated monthly total and actions when open', () => {
    render(
      <CalculationCompletedModal
        isOpen={true}
        estimate={dummyEstimate}
        provider="azure"
        onClose={vi.fn()}
        onViewDetails={vi.fn()}
        onExportProposal={vi.fn()}
      />
    );

    expect(screen.getByText('Price Calculation Completed')).toBeInTheDocument();
    expect(screen.getByText('$314.88')).toBeInTheDocument();
    expect(screen.getByText('View Full Details')).toBeInTheDocument();
    expect(screen.getByText('Export Proposal (.md)')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CalculationCompletedModal
        isOpen={false}
        estimate={dummyEstimate}
        provider="azure"
        onClose={vi.fn()}
        onViewDetails={vi.fn()}
        onExportProposal={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
