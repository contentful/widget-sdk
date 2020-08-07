import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SpaceCard } from './SpaceCard';

const mockLimits = ['limit 1', 'limit 2', 'limit 3'];

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
    const handleSelect = jest.fn();

    build({ handleSelect });

    userEvent.click(screen.getByTestId('space-cta'));

    expect(handleSelect).toBeCalled();
  });
});

function build(customProps) {
  const props = {
    content: {
      type: 'medium',
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
    handleSelect: () => {},
    ...customProps,
  };

  render(<SpaceCard {...props} />);
}
