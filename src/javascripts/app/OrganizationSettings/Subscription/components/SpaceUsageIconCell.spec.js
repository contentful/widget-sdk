import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceUsageIconCell } from './SpaceUsageIconCell';

const defaultProps = {
  limit: 10,
  usage: 1,
  utilization: 1 / 10,
};

const build = (props = defaultProps) => {
  render(<SpaceUsageIconCell {...props} />);
};

describe('SpaceUsageIconCell', () => {
  it('warns the usage is approaching the limit', () => {
    const props = {
      limit: 10,
      usage: 8,
      utilization: 8 / 10,
    };

    build(props);

    fireEvent.mouseOver(screen.getByTestId('subscription-page.spaces-list.usage-tooltip-trigger'));
    expect(screen.getByTestId('subscription-page.spaces-list.usage-tooltip')).toHaveTextContent(
      'Approaching limit (80%)'
    );
  });

  it('warns the usage is exceeding the limit', () => {
    const props = {
      limit: 10,
      usage: 11,
      utilization: 11 / 10,
    };
    build(props);

    fireEvent.mouseOver(screen.getByTestId('subscription-page.spaces-list.usage-tooltip-trigger'));
    expect(screen.getByTestId('subscription-page.spaces-list.usage-tooltip')).toHaveTextContent(
      'Exceeding limit (110%)'
    );
  });

  it('warns the usage has reached the limit', () => {
    const props = {
      limit: 10,
      usage: 10,
      utilization: 10 / 10,
    };
    build(props);

    fireEvent.mouseOver(screen.getByTestId('subscription-page.spaces-list.usage-tooltip-trigger'));
    expect(screen.getByTestId('subscription-page.spaces-list.usage-tooltip')).toHaveTextContent(
      'Reached limit (100%)'
    );
  });
});
