import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';

import { SpaceCard } from './SpaceCard';

const mockLimits = ['limit 1', 'limit 2', 'limit 3'];
const mockEnterpriseContent = {
  type: SPACE_PURCHASE_TYPES.ENTERPRISE,
  title: (
    <>
      <b>Enterprise</b>
    </>
  ),
  description: 'Enterprise description',
  price: (
    <>
      <b>Custom</b>
      <br />
      to your needs
    </>
  ),
  callToAction: 'Talk to us',
  limitsTitle: 'All the Team features, plus:',
  limits: mockLimits,
};

describe('SpaceCard', () => {
  it('should show a heading', () => {
    build();

    expect(screen.getByTestId('space-heading')).toBeVisible();
  });

  it('should show a space description', () => {
    build();

    expect(screen.getByTestId('space-description')).toBeVisible();
  });

  it('should show a space price', () => {
    build();

    expect(screen.getByTestId('space-price')).toBeVisible();
  });

  it('should show the space limits', () => {
    build();

    expect(screen.getByTestId('space-limits')).toBeVisible();
    expect(screen.getByTestId('space-limits').children).toHaveLength(mockLimits.length);
  });

  it('should call CTA function if clicked', () => {
    const onSelect = jest.fn();

    build({ onSelect });

    userEvent.click(screen.getByTestId('select-space-cta'));

    expect(onSelect).toBeCalled();
  });

  it('should render "Talk to us" button if it is an enterprise card', () => {
    build({ content: mockEnterpriseContent });

    const enterpriseButton = screen.getByTestId('select-space-cta');
    expect(enterpriseButton).toBeDefined();
    expect(enterpriseButton).toHaveTextContent('Talk to us');
  });
});

function build(customProps) {
  const props = {
    organizationId: 'random_org_id',
    loading: false,
    content: {
      type: SPACE_PURCHASE_TYPES.MEDIUM,
      title: (
        <>
          <b>Team</b> Medium
        </>
      ),
      description: 'Team medium description',
      price: (
        <>
          $<b>489</b>
          <br />
          /month
        </>
      ),
      callToAction: 'Select',
      limitsTitle: 'These are the limits:',
      limits: mockLimits,
    },
    onSelect: () => {},
    ...customProps,
  };

  render(<SpaceCard {...props} />);
}
