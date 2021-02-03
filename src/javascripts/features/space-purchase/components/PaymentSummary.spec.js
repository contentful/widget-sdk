import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { PLATFORM_CONTENT } from '../utils/platformContent';
import { SpacePurchaseState } from '../context';
import { PaymentSummary } from './PaymentSummary';

const mockSelectedPlan = { name: 'Medium', price: 123 };
const mockSelectedPlatform = { title: PLATFORM_CONTENT.composePlatform.title, price: 999 };

const formatPrice = (value) => `$${parseInt(value, 10).toLocaleString('en-US')}`;

describe('PaymentSummary', () => {
  it('should show the plan name and monthly total', () => {
    build();

    expect(screen.getByTestId('order-summary.selected-plan-name')).toHaveTextContent(
      mockSelectedPlan.name
    );
    expect(screen.getByTestId('order-summary.monthly-total')).toHaveTextContent(
      mockSelectedPlan.price
    );
  });

  it('should show the platform and space plan names, prices and monthly total', () => {
    build(null, { selectedPlatform: mockSelectedPlatform });

    expect(screen.getByTestId('order-summary.selected-platform')).toHaveTextContent(
      `${mockSelectedPlatform.title} ${formatPrice(mockSelectedPlatform.price)}`
    );
    expect(screen.getByTestId('order-summary.selected-plan')).toHaveTextContent(
      `${mockSelectedPlan.name} space ${formatPrice(mockSelectedPlan.price)}`
    );
    expect(screen.getByTestId('order-summary.monthly-total')).toHaveTextContent(
      `Monthly total ${formatPrice(mockSelectedPlatform.price + mockSelectedPlan.price)}`
    );
  });

  it('should show the platform name, price and monthly total when no space plan is selected', () => {
    build(null, { selectedPlatform: mockSelectedPlatform, selectedPlan: undefined });

    expect(screen.getByTestId('order-summary.selected-platform')).toHaveTextContent(
      `${mockSelectedPlatform.title} ${formatPrice(mockSelectedPlatform.price)}`
    );
    expect(screen.queryByTestId('order-summary.selected-plan')).toBeNull();
    expect(screen.getByTestId('order-summary.monthly-total')).toHaveTextContent(
      `Monthly total ${formatPrice(mockSelectedPlatform.price)}`
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

function build(customProps, customState) {
  const props = {
    selectedPlan: mockSelectedPlan,
    ...customProps,
  };

  const contextValue = {
    state: { selectedPlan: mockSelectedPlan, ...customState },
    dispatch: jest.fn(),
  };

  render(
    <SpacePurchaseState.Provider value={contextValue}>
      <PaymentSummary {...props} />
    </SpacePurchaseState.Provider>
  );
}
