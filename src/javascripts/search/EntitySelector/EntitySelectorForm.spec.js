import React from 'react';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import * as entityHelpers from 'app/entity_editor/entityHelpers';
import { getCurrentSpaceFeature } from 'data/CMA/ProductCatalog';

import { ITEMS_PER_PAGE } from './useEntityLoader';
import EntitySelectorForm from './EntitySelectorForm';

const entity = (type, id) => ({
  sys: {
    id,
    type,
    contentType: {
      sys: {
        id: 'content-type',
      },
    },
  },
  fields: {
    file: 'text.txt',
  },
});

const entries = [
  entity('Entry', 'entry-1'),
  entity('Entry', 'entry-2'),
  entity('Entry', 'entry-3'),
  entity('Entry', 'entry-4'),
  entity('Entry', 'entry-5'),
];

const fetchMock = jest.fn().mockResolvedValue({
  items: entries,
  total: 5,
});

const getDefaultProps = (props = {}) => {
  const { labels = {}, ...rest } = props;
  return {
    labels: {
      input: 'Search for entries:',
      selected: 'selected entries',
      empty: 'No entries',
      insert: 'Insert selected entries',
      searchPlaceholder: 'Search %total% entries',
      ...labels,
    },
    onNoEntities: jest.fn(),
    onChange: jest.fn(),
    listHeight: 20,
    locale: 'en-US',
    withCreate: false,
    multiple: true,
    entityType: 'Entry',
    linkedContentTypeIds: [],
    fetch: fetchMock,
    pagination: false,
    ...rest,
  };
};

getCurrentSpaceFeature.mockResolvedValue(false);

jest.mock('ng/spaceContext', () => {
  const contentType = {
    data: {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: '4ewyIpxr86t804EdLMv2lV',
          },
        },
        environment: {
          sys: {
            type: 'Link',
            linkType: 'Environment',
            id: 'b8fb6fda-6745-4f2e-90f6-89b9db072d2d',
          },
        },
        id: 'content-type',
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '4Ewlm588a3nWdO8P6mvXEE',
          },
        },
        updatedAt: '2020-07-16T17:59:17.065Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '4Ewlm588a3nWdO8P6mvXEE',
          },
        },
        createdAt: '2020-07-16T17:59:17.065Z',
        version: 0,
        type: 'ContentType',
      },
      name: 'Test-content-type',
      fields: [
        {
          id: 'fieldKapgihOYEzLC3Ijsukdxx',
          apiName: 'fieldKapgihOYEzLC3Ijsukdxx',
          name: '5Y0WGckPdzyGVCK7yrRlgA',
          type: 'Symbol',
          localized: false,
          required: false,
          disabled: false,
          omitted: false,
          deleted: false,
          validations: [],
        },
      ],
    },
  };

  const spaceContextStub = {
    publishedCTs: {
      getAllBare: jest.fn().mockReturnValue([contentType.data]),
      fetch: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue(contentType),
    },
    getId: jest.fn().mockReturnValue('space-id'),
    getEnvironmentId: jest.fn().mockReturnValue('environment-id'),
    getData: jest.fn().mockReturnValue('organization-id'),
    users: {
      getAll: jest.fn().mockResolvedValue([
        {
          sys: {
            id: 'user-1',
          },
          firstName: 'Mr',
          lastName: 'Test',
        },
      ]), // to let the search bar render
    },
  };

  return spaceContextStub;
});

jest.spyOn(entityHelpers, 'newForLocale').mockImplementation(() => ({
  assetFile: jest.fn().mockResolvedValue({ fileName: 'file.txt' }),
  entityTitle: jest.fn((entity) => Promise.resolve(entity.sys.type)),
  entityFile: jest.fn(() => Promise.resolve({ fileName: 'file.txt' })),
  entityDescription: jest.fn().mockResolvedValue('Description'),
}));

jest.mock('access_control/AccessChecker', () => {
  const original = jest.requireActual('access_control/AccessChecker');
  return {
    ...original,
    canPerformActionOnEntryOfType: () => true,
  };
});

describe('EntitySelectorForm', () => {
  afterEach(cleanup);

  it('[multiple: false] should not allow the option to render selected entities', async () => {
    const props = getDefaultProps({ multiple: false });
    const { queryByTestId, findAllByTestId } = render(<EntitySelectorForm {...props} />);
    await findAllByTestId('cf-ui-entry-card');
    expect(queryByTestId('show-selected')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should render the entity selector in initial state', async () => {
    const props = getDefaultProps();
    const { getByTestId, findAllByTestId } = render(<EntitySelectorForm {...props} />);
    await findAllByTestId('cf-ui-entry-card');
    expect(getByTestId('show-selected')).toBeDefined();
  });

  it('should display an option to create entities of given content type if none were fetched', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
    });
    const props = getDefaultProps({ withCreate: true, fetch: fetchMock });
    const { queryAllByText, findByText } = render(<EntitySelectorForm {...props} />);
    await findByText('Create new Test-content-type');
    expect(queryAllByText('cf-ui-entry-card')).toHaveLength(0);
    expect(props.onNoEntities).toHaveBeenCalled();
  });

  it('[multiple: false] should toggle selection', async () => {
    const props = getDefaultProps({ multiple: false });
    const { getAllByTestId, findAllByTestId } = render(<EntitySelectorForm {...props} />);
    await findAllByTestId('cf-ui-entry-card');
    const cards = getAllByTestId('cf-ui-entry-card');

    cards[0].click();

    await waitFor(() => expect(props.onChange).toBeCalledWith([entries[0]]));
  });

  it('[multiple: false, withCreate: true] provides an option to create an entity', async () => {
    const props = getDefaultProps({ multiple: false, withCreate: true });
    const { getByTestId, findAllByTestId } = render(<EntitySelectorForm {...props} />);
    await findAllByTestId('cf-ui-entry-card');
    expect(getByTestId('create-entry')).toBeDefined();
  });

  it('toggles selector display mode from selection to selected and back', async () => {
    const props = getDefaultProps();
    const { getAllByTestId, getByTestId, findAllByTestId } = render(
      <EntitySelectorForm {...props} />
    );
    await findAllByTestId('cf-ui-entry-card');
    const cards = getAllByTestId('cf-ui-entry-card');

    cards[0].click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (1)')
    );

    getByTestId('show-selected').click();
    await waitFor(() =>
      expect(getByTestId('hide-selected').textContent).toBe('Hide selected entries (1)')
    );

    expect(getAllByTestId('cf-ui-entry-card')).toHaveLength(1);

    getByTestId('hide-selected').click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (1)')
    );

    expect(getAllByTestId('cf-ui-entry-card')).toHaveLength(entries.length);
  });

  it('supports batch select / deselect', async () => {
    const props = getDefaultProps();
    const { getAllByTestId, getByTestId, findAllByTestId } = render(
      <EntitySelectorForm {...props} />
    );
    await findAllByTestId('cf-ui-entry-card');
    const cards = getAllByTestId('cf-ui-entry-card');

    cards[0].click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (1)')
    );
    expect(props.onChange).toHaveBeenCalledWith([entries[0]]);

    fireEvent.click(cards[cards.length - 1], { shiftKey: true });
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (5)')
    );

    expect(props.onChange).toHaveBeenCalledWith(entries);

    // deselect
    cards[0].click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (4)')
    );

    expect(props.onChange).toHaveBeenCalledWith(entries.slice(1));

    // batch deselect
    fireEvent.click(cards[cards.length - 3], { shiftKey: true });
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (2)')
    );

    expect(props.onChange).toHaveBeenCalledWith(entries.slice(entries.length - 2));
  });

  it('renders assets', async () => {
    const assets = [
      entity('Asset', 'asset-1'),
      entity('Asset', 'asset-2'),
      entity('Asset', 'asset-3'),
    ];
    const fetchMock = jest.fn().mockResolvedValue({
      items: assets,
      total: 3,
    });
    const props = getDefaultProps({ fetch: fetchMock, entityType: 'Asset' });
    const { findAllByTestId, getAllByTestId } = render(<EntitySelectorForm {...props} />);
    await findAllByTestId('cf-ui-asset-card');
    const cards = getAllByTestId('cf-ui-asset-card');
    expect(cards).toHaveLength(assets.length);
  });

  it('toggles asset selection', async () => {
    const assets = [
      entity('Asset', 'asset-1'),
      entity('Asset', 'asset-2'),
      entity('Asset', 'asset-3'),
    ];
    const fetchMock = jest.fn().mockResolvedValue({
      items: assets,
      total: 3,
    });
    const props = getDefaultProps({ fetch: fetchMock, entityType: 'Asset' });
    const { findAllByTestId, getByTestId, getAllByTestId } = render(
      <EntitySelectorForm {...props} />
    );
    await findAllByTestId('cf-ui-asset-card');
    const cards = getAllByTestId('cf-ui-asset-card');
    expect(cards).toHaveLength(assets.length);

    cards[0].click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (1)')
    );

    expect(props.onChange).toHaveBeenCalledWith([assets[0]]);
  });

  it('toggles assets in batches', async () => {
    const assets = [
      entity('Asset', 'asset-1'),
      entity('Asset', 'asset-2'),
      entity('Asset', 'asset-3'),
    ];
    const fetchMock = jest.fn().mockResolvedValue({
      items: assets,
      total: 3,
    });
    const props = getDefaultProps({ fetch: fetchMock, entityType: 'Asset' });
    const { findAllByTestId, getByTestId, getAllByTestId } = render(
      <EntitySelectorForm {...props} />
    );
    await findAllByTestId('cf-ui-asset-card');
    const cards = getAllByTestId('cf-ui-asset-card');
    expect(cards).toHaveLength(assets.length);

    cards[0].click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (1)')
    );

    expect(props.onChange).toHaveBeenCalledWith([assets[0]]);
    fireEvent.click(cards[cards.length - 1], { shiftKey: true });
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (3)')
    );

    expect(props.onChange).toHaveBeenCalledWith(assets);

    // deselect
    cards[0].click();
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (2)')
    );

    expect(props.onChange).toHaveBeenCalledWith(assets.slice(1));
    fireEvent.click(cards[cards.length - 1], { shiftKey: true });
    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (0)')
    );

    expect(props.onChange).toHaveBeenCalledWith([]);
  });

  it('should render the error details as a note', async () => {
    const error = {
      data: {
        message: 'I broke down :(',
      },
      status: 500,
    };
    const fetchMock = jest.fn().mockRejectedValue(error);
    const props = getDefaultProps({ fetch: fetchMock });
    const { findByText, findByTestId } = render(<EntitySelectorForm {...props} />);
    await findByTestId('cf-ui-note');
    expect(findByText(error.data.message)).toBeDefined();
  });

  it('doesnt attempt to fetch after search state becomes empty', async () => {
    const totalExpectedEntities = ITEMS_PER_PAGE + 20;
    const entitiesBatches = [
      {
        items: new Array(ITEMS_PER_PAGE).fill().map((_, id) => entity('Entry', `id-${id}`)),
        hasMore: true,
        total: totalExpectedEntities,
      },
      {
        items: new Array(20).fill().map((_, id) => entity('Entry', `next-page-id-${id}`)),
        hasMore: false,
        total: totalExpectedEntities,
      },
    ];
    const fetchMock = jest
      .fn()
      // initial
      .mockResolvedValueOnce(entitiesBatches[0])
      // search
      .mockResolvedValueOnce(entitiesBatches[1]);

    const props = getDefaultProps({ fetch: fetchMock });
    const { getByTestId, findAllByTestId } = render(<EntitySelectorForm {...props} />);
    await findAllByTestId('cf-ui-entry-card');

    const searchbar = getByTestId('queryInput');

    act(() => {
      userEvent.type(searchbar, 'How to learn C++ in 20 days');
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ searchText: 'How to learn C++ in 20 days' })
    );

    act(() => {
      userEvent.clear(searchbar);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('appends selected items after search to the list of all items', async () => {
    const totalExpectedEntities = ITEMS_PER_PAGE + 20;
    const entitiesBatches = [
      {
        items: new Array(ITEMS_PER_PAGE).fill().map((_, id) => entity('Entry', `id-${id}`)),
        hasMore: true,
        total: totalExpectedEntities,
      },
      {
        items: new Array(20).fill().map((_, id) => entity('Entry', `next-page-id-${id}`)),
        hasMore: false,
        total: totalExpectedEntities,
      },
    ];
    const fetchMock = jest
      .fn()
      // initial
      .mockResolvedValueOnce(entitiesBatches[0])
      // search
      .mockResolvedValueOnce(entitiesBatches[1]);

    const props = getDefaultProps({ fetch: fetchMock });
    const { getByTestId, getAllByTestId, findAllByTestId } = render(
      <EntitySelectorForm {...props} />
    );
    await findAllByTestId('cf-ui-entry-card');

    const searchbar = getByTestId('queryInput');

    act(() => {
      userEvent.type(searchbar, 'How to learn C++ in 20 days');
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ searchText: 'How to learn C++ in 20 days' })
    );

    act(() => {
      const cards = getAllByTestId('cf-ui-entry-card');
      expect(cards).toHaveLength(20);
      cards[0].click();
    });

    await waitFor(() =>
      expect(getByTestId('show-selected').textContent).toBe('Show selected entries (1)')
    );
    expect(props.onChange).toHaveBeenCalledWith([entitiesBatches[1].items[0]]);

    act(() => {
      fireEvent.change(searchbar, { target: { value: '' } });
    });

    await waitFor(() =>
      expect(getAllByTestId('cf-ui-entry-card')).toHaveLength(ITEMS_PER_PAGE + 1)
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
