import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiArchitectureAdvisorModal } from './AiArchitectureAdvisorModal';

describe('AiArchitectureAdvisorModal', () => {
  it('renders workload presets and generates AI recommended topology', () => {
    const handleClose = vi.fn();
    const handleApplyPrompt = vi.fn();

    render(
      <AiArchitectureAdvisorModal
        initialProvider="azure"
        onClose={handleClose}
        onApplyPrompt={handleApplyPrompt}
      />
    );

    // Verify modal title
    expect(screen.getByText('AI Architecture Advisor & Smart Prompt Studio')).toBeInTheDocument();

    // Verify presets are rendered
    expect(screen.getByText('SaaS Web Application')).toBeInTheDocument();
    expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument();

    // Click Generate AI Recommendation
    fireEvent.click(screen.getByRole('button', { name: /Generate AI Recommendation/i }));

    // Verify Stage 2 review is shown
    expect(screen.getByText('AI Recommended Architecture Topology')).toBeInTheDocument();
    expect(screen.getByText('Packed Infrastructure Prompt Preview')).toBeInTheDocument();

    // Click Pack & Apply
    fireEvent.click(screen.getByRole('button', { name: /Pack & Apply Optimized Prompt/i }));

    expect(handleApplyPrompt).toHaveBeenCalledTimes(1);
    expect(handleApplyPrompt.mock.calls[0][0]).toContain('Workload Requirement: SaaS Web Application');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
