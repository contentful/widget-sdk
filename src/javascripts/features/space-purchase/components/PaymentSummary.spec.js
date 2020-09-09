import React from 'react';
import { render, screen } from '@testing-library/react';
import { PaymentSummary } from './PaymentSummary';

const mockSelectedPlan = { name: 'Medium', price: 123 };

describe('PaymentSummary', () => {
  it('should the plan name and price', () => {
    build();

    expect(screen.getByTestId('order-summary.selected-plan-name')).toHaveTextContent(
      mockSelectedPlan.name
    );
    expect(screen.getByTestId('order-summary.selected-plan-price')).toHaveTextContent(
      mockSelectedPlan.price
    );
  });
});

function build(customProps) {
  const props = {
    selectedPlan: mockSelectedPlan,
    ...customProps,
  };

  render(<PaymentSummary {...props} />);
}
