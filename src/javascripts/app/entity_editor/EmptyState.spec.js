import React from 'react';
import { render } from '@testing-library/react';
import { EmptyState } from './EmptyState';

const renderComponent = (slideState = {}) => {
  const defaultProps = {
    slideState: {
      loadingError: null,
      slide: {
        type: 'Entry',
      },
      ...slideState,
    },
  };
  return render(<EmptyState {...defaultProps} />);
};

describe('EmptyState', () => {
  it('should render the loader', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('emptystate-loader')).toBeInTheDocument();
  });

  ['Asset', 'Entry', 'BulkEditor'].forEach((type) => {
    it(`should show the ${type} missing error`, () => {
      const { queryByTestId } = renderComponent({
        loadingError: {
          statusCode: 404,
        },
        slide: {
          type,
        },
      });
      const error = queryByTestId('emptystate-error');
      expect(error).toBeInTheDocument();
      const entityType = type === 'Asset' ? 'Asset' : 'Entry';
      expect(error.innerHTML.includes(`${entityType} missing or inaccessible`)).toBe(true);
    });
  });

  ['Asset', 'Entry', 'BulkEditor'].forEach((type) => {
    it(`should show the ${type} other error`, () => {
      const { queryByTestId } = renderComponent({
        loadingError: {
          statusCode: 400,
          body: {
            message: 'BAD_REQUEST',
          },
        },
        slide: {
          path: [4321],
          id: '1234',
          type,
        },
      });
      const error = queryByTestId('emptystate-error');
      expect(error).toBeInTheDocument();
      const entityType = type === 'Asset' ? 'Asset' : 'Entry';
      expect(error.innerHTML.includes(`Error loading ${entityType.toLowerCase()} with id`)).toBe(
        true
      );
      expect(error.innerHTML.includes(type === 'BulkEditor' ? '4321' : '1234')).toBe(true);
      expect(error.innerHTML.includes('BAD_REQUEST')).toBe(true);
    });
  });
});
