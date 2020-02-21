import React from 'react';
import { render } from '@testing-library/react';
import SSOUpsellState from './SSOUpsellState';

const renderComponent = () => {
  const component = <SSOUpsellState />;
  return render(component);
};

describe('SSOUpsellState', () => {
  it('should render upsell state with get in touch button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('get-in-touch-btn')).toBeInTheDocument();
  });
});
