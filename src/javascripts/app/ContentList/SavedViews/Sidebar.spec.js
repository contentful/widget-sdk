import React from 'react';
import { render } from '@testing-library/react';

import Sidebar from './Sidebar';

jest.mock('./View', () => (props) => <div data-test-id="child">{JSON.stringify(props)}</div>);

const listViewContext = {
  getView: jest.fn().mockReturnValue({}),
  setView: jest.fn(),
  setViewKey: jest.fn(),
  setViewAssigned: jest.fn(),
};

const onSelectSavedView = jest.fn();
const defaultProps = {
  entityType: 'entry',
  onSelectSavedView,
  listViewContext,
};

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
