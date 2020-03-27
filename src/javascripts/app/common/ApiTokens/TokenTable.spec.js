import React from 'react';
import { render } from '@testing-library/react';

import TokenTable from './TokenTable';

const defaultProps = {
  tokens: [
    {
      id: '1',
      name: 'example token',
    },
  ],
  revoke: jest.fn(),
};

describe('TokenList', () => {
  it('should render TokenTable component if tokens are recieved', () => {
    const { getByTestId } = render(<TokenTable {...defaultProps} />);
    expect(getByTestId('pat.tokenTable')).toBeInTheDocument();
  });

  it('should render empty div if no tokens are avalaible', () => {
    const localTestProps = {
      ...defaultProps,
      tokens: [],
    };

    const { getByTestId } = render(<TokenTable {...localTestProps} />);
    expect(getByTestId('pat.emptyTokenTable')).toBeInTheDocument();
  });
});
