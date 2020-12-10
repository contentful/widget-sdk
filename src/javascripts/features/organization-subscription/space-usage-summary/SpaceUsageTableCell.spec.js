import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpaceUsageTableCell } from './SpaceUsageTableCell';

const defaultProps = {
  limit: 10,
  usage: 1,
  utilization: 1 / 10,
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
  });
});
