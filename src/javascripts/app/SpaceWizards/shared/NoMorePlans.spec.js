import React from 'react';
import { render, screen } from '@testing-library/react';
import NoMorePlans from './NoMorePlans';

describe('NoMorePlans', () => {
  it('should not show the "contact us" button if canSetupBilling is false', () => {
    build();

    expect(screen.queryByTestId('cf-contact-us-button')).toBeNull();
  });

  it('should show the "contact us" button if canSetupBilling is true', () => {
    build({ canSetupBilling: true });

    expect(screen.getByTestId('cf-contact-us-button')).toBeVisible();
  });
});

function build(custom) {
  const props = Object.assign(
    {
      canSetupBilling: false,
    },
    custom
  );

  render(<NoMorePlans {...props} />);
}
