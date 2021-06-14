import React from 'react';
import {
  screen,
  render,
  waitFor,
  fireEvent,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { flatten, concat } from 'lodash';

import { ContentTypeListPage as Page } from './ContentTypeListPage';

import { fetchContentTypes, filterContentTypes } from './ContentTypeListService';
import * as contentTypeFactory from 'test/helpers/contentTypeFactory';
// eslint-disable-next-line no-restricted-imports
import { MemoryRouter } from 'react-router';

jest.mock('lodash/debounce', () => (fn) => fn);

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' }),
}));

jest.mock('./ContentTypeList', () => {
  return { ContentTypeList: (props) => props.contentTypes.map((item) => item.sys.id).join(',') };
});

jest.mock('access_control/AccessChecker', () => ({
  shouldHide: jest.fn().mockReturnValue(false),
  shouldDisable: jest.fn().mockReturnValue(false),
  Action: { CREATE: 'Create' },
}));

const testIds = {
  contentLoader: 'content-loader',
  contentTypeList: 'content-type-list',
  emptyState: 'empty-state',
  noSearchResults: 'no-search-results',
  searchBox: 'search-box',
  statusFilter: 'status-filter',
};

jest.mock('./ContentTypeListService', () => ({
  fetchContentTypes: jest.fn(),
  filterContentTypes: jest.fn(),
}));

const mockContentTypeList = [
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
];

function renderComponent() {
  render(<Page />, { wrapper: MemoryRouter });
  return waitForElementToBeRemoved(() => screen.getByTestId(testIds.contentLoader));
}

describe('ContentTypeList Page', () => {
  beforeEach(() => {
    fetchContentTypes.mockReturnValue(mockContentTypeList);
    filterContentTypes.mockReturnValue(mockContentTypeList);
  });

  it('renders results once loaded', async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByTestId(testIds.contentTypeList)).toBeVisible());

    expect(screen.queryByTestId(testIds.contentLoader)).not.toBeInTheDocument();
    expect(screen.getByTestId(testIds.searchBox)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.statusFilter)).toBeInTheDocument();
  });

  it('renders empty page if no content types loaded', async () => {
    fetchContentTypes.mockReturnValue([]);
    filterContentTypes.mockReturnValue([]);
    await renderComponent({});

    await waitFor(() => expect(screen.getByTestId(testIds.emptyState)).toBeVisible());

    expect(screen.queryByTestId(testIds.contentTypeList)).not.toBeInTheDocument();
  });

  describe('Search Box', () => {
    const contentTypes = [
      contentTypeFactory.createPublished({ name: 'aaa' }),
      contentTypeFactory.createPublished({ name: 'bbb' }),
    ];

    it('filters results by search box value', async () => {
      fetchContentTypes.mockReturnValue(contentTypes);
      filterContentTypes.mockReturnValue([contentTypeFactory.createPublished({ name: 'aaa' })]);

      await renderComponent();
      await waitFor(() => expect(screen.getByTestId(testIds.searchBox)).toBeVisible());

      await fireEvent.change(screen.getByTestId(testIds.searchBox), {
        target: { value: 'a' },
      });

      expect(screen.queryByTestId(testIds.contentTypeList).textContent).toMatchInlineSnapshot(
        `"content-type-id28"`
      );
    });

    it('renders no results', async () => {
      fetchContentTypes.mockReturnValue(contentTypes);
      filterContentTypes.mockReturnValue([]);

      await renderComponent();
      await waitFor(() => expect(screen.getByTestId(testIds.searchBox)).toBeVisible());

      await fireEvent.change(screen.getByTestId(testIds.searchBox), {
        target: { value: 'x' },
      });

      expect(screen.queryByTestId(testIds.contentTypeList)).not.toBeInTheDocument();
      expect(screen.getByTestId(testIds.noSearchResults)).toBeInTheDocument();
    });
  });

  describe('Status filter', () => {
    const contentTypesByStatus = {
      draft: [contentTypeFactory.createDraft(), contentTypeFactory.createDraft()],
      published: [contentTypeFactory.createPublished(), contentTypeFactory.createPublished()],
      updated: [contentTypeFactory.createUpdated()],
    };

    const contentTypes = flatten(Object.values(contentTypesByStatus));

    it('highlights default status (All) after page load', async () => {
      fetchContentTypes.mockReturnValue(contentTypes);
      filterContentTypes.mockReturnValue(contentTypes);

      await renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId(testIds.statusFilter)).toBeVisible();
      });

      expect(screen.getByTestId('status-undefined')).toBeInTheDocument();
    });

    /* eslint-disable-next-line no-restricted-syntax */
    describe.each`
      status       | expectedResult
      ${'draft'}   | ${contentTypesByStatus.draft}
      ${'active'}  | ${concat(contentTypesByStatus.published, contentTypesByStatus.updated)}
      ${'changed'} | ${contentTypesByStatus.updated}
      ${undefined} | ${contentTypes}
    `('filters list', ({ status, expectedResult }) => {
      it(`by status: ${status || 'All'}`, async () => {
        fetchContentTypes.mockReturnValue(contentTypes);
        filterContentTypes.mockReturnValue(expectedResult);

        await renderComponent();

        expect(screen.queryByTestId(testIds.statusFilter)).toBeVisible();

        fireEvent.click(screen.getByTestId(`status-${status}`));
        expect(filterContentTypes).toHaveBeenCalled();

        expect(screen.getByTestId(testIds.contentTypeList)).toBeInTheDocument();
        expect(screen.getByTestId(testIds.contentTypeList).textContent).toEqual(
          expectedResult.map((item) => item.sys.id).join(',')
        );
      });
    });
  });
});
