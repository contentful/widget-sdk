import React from 'react';
import { render } from '@testing-library/react';

import TokenList from './TokenList';

const defaultProps = {
  loadingTokensError: false,
  loadingTokens: false,
  tokens: [],
  currentPage: 1,
  totalPages: 1,
  revoke: jest.fn(),
  selectPage: jest.fn(),
};

describe('TokenList', () => {
  it('should render Loading component if loadingTokens', () => {
    const localTestProps = {
      ...defaultProps,
      loadingTokens: true,
    };

    const { getByTestId } = render(<TokenList {...localTestProps} />);
    expect(getByTestId('pat.loading')).toBeInTheDocument();
  });

  it('should render TokenList component with TokenTable', () => {
    const { getByTestId } = render(<TokenList {...defaultProps} />);
    expect(getByTestId('pat.list')).toBeInTheDocument();
  });

  it('should render error Note if loadingTokensError', () => {
    const localTestProps = {
      ...defaultProps,
      loadingTokensError: true,
    };

    const { getByTestId } = render(<TokenList {...localTestProps} />);

    expect(getByTestId('cf-ui-note')).toBeInTheDocument();
  });
});
