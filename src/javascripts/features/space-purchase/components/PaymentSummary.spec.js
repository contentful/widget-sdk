import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('should show the payment buttons if showButtons is true', () => {
    build({ showButtons: true });

    expect(screen.getByTestId('order-summary.buttons')).toBeVisible();
  });

  it('should call onConfirm when the submit button is clicked', () => {
    const onConfirm = jest.fn();
    build({ showButtons: true, onConfirm });

    fireEvent.click(screen.getByTestId('order-summary.confirm'));

    expect(onConfirm).toBeCalled();
  });

  it('should call onBack when the back button is clicked', () => {
    const onBack = jest.fn();
    build({ showButtons: true, onBack });

    fireEvent.click(screen.getByTestId('order-summary.back'));

    expect(onBack).toBeCalled();
  });
});

function build(customProps) {
  const props = {
    selectedPlan: mockSelectedPlan,
    ...customProps,
  };

  render(<PaymentSummary {...props} />);
}
