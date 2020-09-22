import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Plan from './Plan';

describe('Plan', () => {
  it('should show the number of remaining spaces if the limit is not zero', () => {
    build();

    expect(screen.getByTestId('space-plan-price')).toHaveTextContent('1/5 used');
  });

  it('should say "unavailable" if the limit is zero', () => {
    build({ limit: 0 });

    expect(screen.getByTestId('space-plan-price')).toHaveTextContent('unavailable');
  });

  it('should have the disabled class if plan is disabled', () => {
    build({ disabled: true });

    expect(screen.getByTestId('space-plans-list.item')).toHaveClass(
      'space-plans-list__item--disabled'
    );
  });

  it('should have the disabled class if plan has reached limit', () => {
    build({ reachedLimit: true });

    expect(screen.getByTestId('space-plans-list.item')).toHaveClass(
      'space-plans-list__item--disabled'
    );
  });

  it('should not show a help tooltip if the plan is not Trial Space', () => {
    build();

    expect(screen.queryByTestId('space-plan-tooltip-trigger')).not.toBeInTheDocument();
  });

  it('should show a help tooltip if the plan is Trial Space', () => {
    build({ showTrialSpaceInfo: true });

    fireEvent.mouseOver(screen.getByTestId('space-plan-tooltip-trigger'));

    expect(screen.getByTestId('space-plan-tooltip')).toHaveTextContent('up to 5');
  });
});

function build(custom = {}) {
  const props = Object.assign(
    {
      resources: [],
      roleSet: {},
      usage: 1,
      limit: 5,
      disabled: false,
      reachedLimit: false,
      name: 'Enterprise plan',
      showTrialSpaceInfo: false,
    },
    custom
  );

  render(<Plan {...props} />);
}
