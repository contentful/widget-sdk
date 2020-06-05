import React from 'react';
import { render } from '@testing-library/react';

import Sidebar from './Sidebar';

jest.mock('./View', () => (props) => <div data-test-id="child">{JSON.stringify(props)}</div>);

const onSelectSavedView = jest.fn();
const defaultProps = { entityType: 'entry', onSelectSavedView, savedViewsUpdated: 0 };

const build = (props = {}) => {
  return render(<Sidebar {...defaultProps} {...props} />);
};

describe('Sidebar.js', () => {
  it('should render the view with the default tab', () => {
    const result = build();
    expect(result.getByTestId('shared-tab')).toHaveAttribute('aria-selected', 'true');
    expect(result.getByTestId('private-tab')).toHaveAttribute('aria-selected', 'false');
    expect(result.getByTestId('child').innerHTML).toEqual(
      JSON.stringify({ ...defaultProps, viewType: 'shared' })
    );
  });

  it('should render the view with the initial tab', () => {
    const result = build({ initialTab: 'private' });
    expect(result.getByTestId('shared-tab')).toHaveAttribute('aria-selected', 'false');
    expect(result.getByTestId('private-tab')).toHaveAttribute('aria-selected', 'true');
    expect(result.getByTestId('child').innerHTML).toEqual(
      JSON.stringify({ ...defaultProps, viewType: 'private' })
    );
  });

  it('should set the view on initalTab property change', () => {
    const { rerender, getByTestId } = build({ initialTab: 'private' });
    expect(getByTestId('shared-tab')).toHaveAttribute('aria-selected', 'false');
    expect(getByTestId('private-tab')).toHaveAttribute('aria-selected', 'true');
    rerender(<Sidebar {...defaultProps} initialTab="shared" />);
    expect(getByTestId('shared-tab')).toHaveAttribute('aria-selected', 'true');
    expect(getByTestId('private-tab')).toHaveAttribute('aria-selected', 'false');
  });

  it('should set the view on tab click', () => {
    const { getByTestId } = build();
    expect(getByTestId('shared-tab')).toHaveAttribute('aria-selected', 'true');
    const privateTab = getByTestId('private-tab');
    expect(privateTab).toHaveAttribute('aria-selected', 'false');
    privateTab.click();
    expect(getByTestId('shared-tab')).toHaveAttribute('aria-selected', 'false');
    expect(getByTestId('private-tab')).toHaveAttribute('aria-selected', 'true');
  });
});
