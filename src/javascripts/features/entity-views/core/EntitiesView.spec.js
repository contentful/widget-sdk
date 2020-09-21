import { EntitiesView } from './EntitiesView';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ListQuery } from 'core/services/ContentQuery';
import * as fake from 'test/helpers/fakeFactory';

const space = fake.Space();
const organization = fake.Organization();

jest.mock('features/entity-search/View', () => ({
  Search: (props) => <div data-test-id="search">{JSON.stringify(props)}</div>,
}));

jest.mock('features/entity-views/core/SavedViews/Sidebar', () => ({
  Sidebar: (props) => <div data-test-id="saved-views-sidebar">{JSON.stringify(props)}</div>,
}));

jest.mock('data/CMA/FetchAll', () => ({
  fetchAll: jest.fn(() => Promise.resolve()),
}));

const listViewContext = {
  getView: jest.fn().mockReturnValue({}),
  setView: jest.fn(),
};

const searchControllerProps = {
  searchKeys: ['searchText', 'searchFilters', 'contentTypeId', 'id'],
  queryKeys: ['searchText', 'searchFilters', 'contentTypeId'],
  getListQuery: ListQuery.getForEntries,
};

let defaultProps;

const mockRenderProp = (testId) => {
  return jest
    .fn()
    .mockImplementation((props) => <div data-test-id={testId}>{JSON.stringify(props)}</div>);
};

const renderComponent = (props = {}) => {
  defaultProps = {
    entityType: 'entry',
    title: 'Content',
    searchControllerProps,
    listViewContext,
    spaceId: space.sys.id,
    environmentId: 'environment-id',
    organization,
    isMasterEnvironment: true,
    space: { data: space },
    fetchEntities: jest.fn().mockResolvedValue([]),
    renderAddEntityActions: mockRenderProp('add-entity-action'),
    renderEmptyState: mockRenderProp('empty-state'),
    renderEntityList: mockRenderProp('entity-list'),
    renderSavedViewsActions: mockRenderProp('saved-views-actions'),
    renderTopContent: mockRenderProp('top-content'),
    getContentTypes: jest.fn().mockReturnValue([]),
    ...props,
  };
  return render(<EntitiesView {...defaultProps} />);
};

describe('EntitiesView', () => {
  it('should initialize and render the empty view', async () => {
    const { queryByTestId } = renderComponent();

    expect(queryByTestId('loading-spinner')).toBeInTheDocument();
    await waitFor(() => expect(queryByTestId('loading-spinner')).not.toBeInTheDocument());
    expect(queryByTestId('entry-view')).toBeInTheDocument();
    expect(defaultProps.renderEmptyState).toHaveBeenCalled();
    expect(defaultProps.fetchEntities).toHaveBeenCalled();
    expect(defaultProps.renderEntityList).not.toHaveBeenCalled();
    expect(defaultProps.renderSavedViewsActions).not.toHaveBeenCalled();
    expect(defaultProps.renderTopContent).not.toHaveBeenCalled();
    expect(queryByTestId('workbench-sidebar')).not.toBeInTheDocument();
    expect(queryByTestId('search')).toBeInTheDocument();
  });

  it('should render the entity list', async () => {
    const entities = [{ sys: { id: 'entry-id' }, isDeleted: () => false }];
    entities.total = 1;
    const fetchEntities = jest.fn().mockResolvedValue(entities);

    const { queryByTestId } = renderComponent({ fetchEntities });

    await waitFor(() => expect(queryByTestId('loading-spinner')).not.toBeInTheDocument());
    expect(queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(defaultProps.renderEntityList.mock.calls[0][0].entities).toBeDefined();
    expect(defaultProps.renderEntityList.mock.calls[0][0].updateEntities).toBeDefined();
    expect(defaultProps.renderEntityList.mock.calls[0][0].isLoading).toBe(false);
    expect(defaultProps.renderEntityList.mock.calls[0][0].showNoEntitiesAdvice).toBe(false);
    expect(defaultProps.renderTopContent).toHaveBeenCalled();
    expect(defaultProps.renderAddEntityActions).toHaveBeenCalled();
    expect(defaultProps.renderSavedViewsActions).toHaveBeenCalled();
    expect(defaultProps.renderEmptyState).not.toHaveBeenCalled();
  });
});
