import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceUsageTableCell } from './SpaceUsageTableCell';

const defaultProps = {
  limit: 10,
  usage: 1,
};

const build = (props = defaultProps) => {
  render(<SpaceUsageTableCell {...props} />);
};

describe('SpacePlanTabelCell', () => {
  it('renders correctly', () => {
    build();
    expect(screen.getByTestId('subscription-page.spaces-list.usage')).toHaveTextContent(
      `${defaultProps.usage}/${defaultProps.limit}`
    );
    expect(() => {
      screen.getByTestId('subscription-page.spaces-list.usage-tooltip');
    }).toThrow();
  });
  it('warns the usage is approaching the limit', () => {
    const props = {
      limit: 10,
      usage: 9,
    };
    build(props);

    fireEvent.mouseOver(screen.getByTestId('subscription-page.spaces-list.usage-tooltip-trigger'));
    expect(screen.getByTestId('subscription-page.spaces-list.usage-tooltip')).toHaveTextContent(
      'Approaching limit (90%)'
    );
  });
  it('warns the usage is exceeding the limit', () => {
    const props = {
      limit: 10,
      usage: 11,
    };
    build(props);

    fireEvent.mouseOver(screen.getByTestId('subscription-page.spaces-list.usage-tooltip-trigger'));
    expect(screen.getByTestId('subscription-page.spaces-list.usage-tooltip')).toHaveTextContent(
      'Exceeding limit (110%)'
    );
  });
});