import React from 'react';
import { render } from '@testing-library/react';
import UserProvisioningUpsellState from './UserProvisioningUpsellState';

const renderComponent = () => {
  const component = <UserProvisioningUpsellState />;
  return render(component);
};

describe('UserProvisioningUpsellState', () => {
  it('should render upsell state with get in touch button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('get-in-touch-btn')).toBeInTheDocument();
  });
});
