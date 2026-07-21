import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiArchitectureAdvisorModal } from './AiArchitectureAdvisorModal';

describe('AiArchitectureAdvisorModal', () => {
  it('renders workload presets and generates AI recommended topology with spacious UI', () => {
    const handleClose = vi.fn();
    const handleApplyPrompt = vi.fn();

    render(
      <AiArchitectureAdvisorModal
        initialProvider="azure"
        onClose={handleClose}
        onApplyPrompt={handleApplyPrompt}
      />
    );

    // Verify modal title & simple titles
    expect(screen.getByText('AI Architecture Advisor & Smart Prompt Studio')).toBeInTheDocument();
    expect(screen.getByText('Web Portal / Software App')).toBeInTheDocument();
    expect(screen.getByText('Online Store / Shopping Site')).toBeInTheDocument();

    // Click Generate AI Sizing
    fireEvent.click(screen.getByRole('button', { name: /Generate AI Sizing & Review Prompt/i }));

    // Verify Stage 2 review is shown with rationale
    expect(screen.getByText('AI Recommended Architecture Sizing')).toBeInTheDocument();
    expect(screen.getByText('Why This Architecture Was Recommended')).toBeInTheDocument();
    expect(screen.getByText(/Packed Infrastructure Prompt Preview/i)).toBeInTheDocument();

    // Click Pack & Apply
    fireEvent.click(screen.getByRole('button', { name: /Pack & Apply Optimized Prompt/i }));

    expect(handleApplyPrompt).toHaveBeenCalledTimes(1);
    expect(handleApplyPrompt.mock.calls[0][0]).toContain('Cloud Infrastructure Goal: Web Portal / Software App');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
