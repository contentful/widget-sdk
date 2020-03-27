import React from 'react';

import { render, waitForElement, fireEvent } from '@testing-library/react';
import { flatten, concat } from 'lodash';

import { ContentTypesPage as Page } from './ContentTypeListPage';

import * as spaceContextMocked from 'ng/spaceContext';
import * as contentTypeFactory from 'test/helpers/contentTypeFactory';

jest.mock('lodash/debounce', () => (fn) => fn);

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' }),
}));

jest.mock('./ContentTypeList', () => {
  return (props) => props.contentTypes.map((item) => item.sys.id).join(',');
});

jest.mock('access_control/AccessChecker', () => ({
  shouldHide: jest.fn().mockReturnValue(false),
  shouldDisable: jest.fn().mockReturnValue(false),
  Action: { CREATE: 'Create' },
}));

const selectors = {
  contentLoader: '[data-test-id="content-loader"]',
  contentTypeList: '[data-test-id="content-type-list"]',
  emptyState: '[data-test-id="empty-state"]',
  noSearchResults: '[data-test-id="no-search-results"]',
  searchBox: '[data-test-id="search-box"]',
  statusFilter: '[data-test-id="status-filter"]',
};

const mockContentTypeList = [
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
];

function renderComponent({ props = {}, items = [] }) {
  const getStub = jest.fn().mockResolvedValue({ items });
  spaceContextMocked.endpoint = getStub;

  const wrapper = render(<Page {...props} />);

  return [wrapper, getStub];
}

describe('ContentTypeList Page', () => {
  it('renders loader', () => {
    const [{ container }, getStub] = renderComponent({ items: mockContentTypeList });

    expect(getStub).toHaveBeenCalledTimes(1);
    expect(container.querySelector(selectors.contentLoader)).toBeInTheDocument();
  });

  it('renders results once loaded', async () => {
    const [{ container }] = renderComponent({ items: mockContentTypeList });

    await waitForElement(() => {
      return container.querySelector(selectors.contentTypeList);
    });

    expect(container.querySelector(selectors.contentLoader)).not.toBeInTheDocument();
    expect(container.querySelector(selectors.searchBox)).toBeInTheDocument();
    expect(container.querySelector(selectors.statusFilter)).toBeInTheDocument();
  });

  it('renders empty page if no content types loaded', async () => {
    const [{ container }] = renderComponent({ items: [] });

    await waitForElement(() => {
      return container.querySelector(selectors.emptyState);
    });

    expect(container.querySelector(selectors.contentTypeList)).not.toBeInTheDocument();
  });

  it('renders predefined search text', async () => {
    const searchText = 'initial search text 42';
    const [{ container }] = renderComponent({
      props: { searchText },
      items: mockContentTypeList,
    });

    await waitForElement(() => {
      return container.querySelector(selectors.searchBox);
    });

    expect(container.querySelector(selectors.searchBox).value).toEqual(searchText);
  });

  describe('Search Box', () => {
    const contentTypes = [
      contentTypeFactory.createPublished({ name: 'aaa' }),
      contentTypeFactory.createPublished({ name: 'bbb' }),
    ];

    it('filters results by search box value', async () => {
      const [{ container }] = renderComponent({
        items: contentTypes,
      });

      await waitForElement(() => {
        return container.querySelector(selectors.searchBox);
      });

      fireEvent.change(container.querySelector(selectors.searchBox), {
        target: { value: 'a' },
      });

      expect(container.querySelector(selectors.contentTypeList).textContent).toMatchInlineSnapshot(
        `"content-type-id11"`
      );
    });

    it('renders no results', async () => {
      const [{ container }] = renderComponent({
        items: contentTypes,
      });

      await waitForElement(() => {
        return container.querySelector(selectors.searchBox);
      });

      fireEvent.change(container.querySelector(selectors.searchBox), {
        target: { value: 'x' },
      });

      expect(container.querySelector(selectors.contentTypeList)).not.toBeInTheDocument();
      expect(container.querySelector(selectors.noSearchResults)).toBeInTheDocument();
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
      const [{ container, getByTestId }] = renderComponent({
        items: contentTypes,
      });

      await waitForElement(() => {
        return container.querySelector(selectors.statusFilter);
      });

      expect(getByTestId('status-undefined')).toBeInTheDocument();
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
        const [{ container, getByTestId }] = renderComponent({
          items: contentTypes,
        });

        await waitForElement(() => {
          return container.querySelector(selectors.statusFilter);
        });

        fireEvent.click(getByTestId(`status-${status}`));

        expect(container.querySelector(selectors.contentTypeList)).toBeInTheDocument();
        expect(container.querySelector(selectors.contentTypeList).textContent).toEqual(
          expectedResult.map((item) => item.sys.id).join(',')
        );
      });
    });
  });
});
