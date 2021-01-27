import React from 'react';
import { render, wait } from '@testing-library/react';
import { getModule } from 'core/NgRegistry';
import * as random from 'utils/Random';

import { View } from './View';

jest.mock('core/components/Portal', () => ({ Portal: () => <div data-test-id="portal" /> }));
jest.mock('./Tree', () => ({
  SortableTree: (props) => <div data-test-id="child">{JSON.stringify(props)}</div>,
}));
jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('utils/Random', () => ({ id: jest.fn() }));
jest.mock('app/InputDialogComponent', () => ({
  openInputDialog: jest.fn().mockResolvedValue('new folder'),
}));

let id;
random.id.mockImplementation(() => `${id++}`);

const listViewContext = {
  getView: jest.fn().mockReturnValue({ id: 'id' }),
  setView: jest.fn(),
  assignView: jest.fn(),
};

const setSelectedView = jest.fn();
const onSelectSavedView = jest.fn();
const defaultProps = {
  listViewContext,
  onSelectSavedView,
  entityType: 'entry',
  viewType: 'shared',
  savedViewsUpdated: 0,
  setSelectedView,
};

const folders = [{ id: '0', views: [], title: 'Directory' }];

const build = (props = {}) => {
  return render(<View {...defaultProps} {...props} />);
};

describe('View.js', () => {
  let scopedApi;

  beforeEach(() => {
    id = '0';
    scopedApi = {
      canEdit: true,
      get: jest.fn().mockResolvedValue(folders),
      set: jest.fn().mockResolvedValue(),
    };
    const entityApi = {
      shared: scopedApi,
      private: scopedApi,
    };

    getModule.mockReturnValue({
      uiConfig: {
        entries: entityApi,
        assets: entityApi,
      },
    });
  });

  it('should render the error note', async () => {
    scopedApi.get.mockRejectedValue();
    const { queryByTestId } = build();
    await wait();
    expect(queryByTestId('view-error')).toBeInTheDocument();
    expect(queryByTestId('view-loading')).not.toBeInTheDocument();
    expect(queryByTestId('view-wrapper')).not.toBeInTheDocument();
  });

  it('should render the loading note', async () => {
    const { queryByTestId } = build();
    expect(queryByTestId('view-loading')).toBeInTheDocument();
    expect(queryByTestId('view-error')).not.toBeInTheDocument();
    expect(queryByTestId('view-wrapper')).not.toBeInTheDocument();
  });

  it('should render the empty state', async () => {
    scopedApi.get.mockResolvedValue([]);
    const { queryByTestId } = build();
    await wait();
    expect(queryByTestId('empty-state')).toBeInTheDocument();
    expect(queryByTestId('button-restore')).toBeInTheDocument();
    expect(queryByTestId('button-add-folder')).toBeInTheDocument();
    expect(queryByTestId('child')).not.toBeInTheDocument();
  });

  it('should render the empty state without editing', async () => {
    scopedApi.get.mockResolvedValue([]);
    scopedApi.canEdit = false;
    const { queryByTestId } = build();
    await wait();
    expect(queryByTestId('empty-state')).toBeInTheDocument();
    expect(queryByTestId('button-restore')).not.toBeInTheDocument();
    expect(queryByTestId('button-add-folder')).not.toBeInTheDocument();
    expect(queryByTestId('child')).not.toBeInTheDocument();
  });

  it('should render the view', async () => {
    const { queryByTestId } = build();
    await wait();
    expect(queryByTestId('child')).toBeInTheDocument();
  });

  it('should be able to create a new folder', async () => {
    const { queryByTestId } = build();
    await wait();
    expect(queryByTestId('child')).toBeInTheDocument();
    queryByTestId('button-add-folder').click();
    await wait();
    expect(scopedApi.set).toHaveBeenLastCalledWith([
      { id: 'default', title: 'Views', views: [] },
      ...folders,
      { id: '1', title: 'new folder', views: [] },
    ]);
  });

  it('should be able to reset folders', async () => {
    scopedApi.get.mockResolvedValue([]);
    const { queryByTestId } = build();
    await wait();
    queryByTestId('button-restore').click();
    await wait();
    expect(scopedApi.set).toHaveBeenLastCalledWith(undefined);
  });
});
