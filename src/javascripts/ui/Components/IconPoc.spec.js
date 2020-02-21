import React from 'react';
import { render } from '@testing-library/react';

import IconPoc from './IconPoc';

const defaultProps = {
  size: 'medium',
  name: 'settings',
  filled: false,
  color: 'white'
};

describe('IconPoc', () => {
  it('should render svg mono icon', () => {
    const { getByTestId } = render(<IconPoc {...defaultProps} />);
    expect(getByTestId('product-icon')).toBeInTheDocument();
  });
});
