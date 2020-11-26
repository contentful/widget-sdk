import { screen } from '@testing-library/react';
import { BillingDetailsStep } from './BillingDetailsStep';
import { renderWithProvider } from '../../testHelpers';

describe('BillingDetailsStep', () => {
  it('should render Billing Details page and Order Summary', async () => {
    await build();

    expect(screen.getByTestId('billing-details.card')).toBeVisible();
    expect(screen.getByTestId('order-summary.card')).toBeVisible();
  });
});

async function build(customProps, customState) {
  const props = {
    onBack: () => {},
    onSubmit: () => {},
    ...customProps,
  };

  await renderWithProvider(
    BillingDetailsStep,
    { selectedPlan: { name: 'Medium', price: 123 }, ...customState },
    props
  );
}
