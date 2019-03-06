import React from 'react';
import Enzyme from 'enzyme';
import { flatten, concat } from 'lodash';

import Page from './ContentTypeListPage.es6';

import * as spaceContextMocked from 'ng/spaceContext';
import flushPromises from 'testHelpers/flushPromises';
import * as contentTypeFactory from 'testHelpers/contentTypeFactory';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' })
}));

jest.mock('./ContentTypeList/index.es6', () => jest.fn().mockReturnValue(true), { virtual: true });

jest.useFakeTimers();

jest.mock(
  'access_control/AccessChecker/index.es6',
  () => ({
    shouldHide: jest.fn().mockReturnValue(false),
    shouldDisable: jest.fn().mockReturnValue(false),
    Action: { CREATE: 'Create' }
  }),
  { virtual: true }
);

const selectors = {
  contentLoader: '[data-test-id="content-loader"]',
  contentTypeList: '[data-test-id="content-type-list"]',
  emptyState: '[data-test-id="empty-state"]',
  noSearchResults: '[data-test-id="no-search-results"]',
  searchBox: '[data-test-id="search-box"]',
  statusFilter: '[data-test-id="status-filter"]'
};

const mockContentTypeList = [
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished()
];

function mount(mock) {
  const getStub = jest.fn().mockResolvedValue(mock);
  spaceContextMocked.endpoint = getStub;

  const wrapper = Enzyme.mount(<Page />);

  return [wrapper, getStub];
}

async function waitForUpdate(wrapper) {
  await flushPromises();
  wrapper.update();
}

describe('ContentTypeList Page', () => {
  it('renders loader', () => {
    const [wrapper, getStub] = mount({ items: mockContentTypeList });

    expect(getStub).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.contentLoader)).toExist();
  });

  it('renders results once loaded', async () => {
    const [wrapper] = mount({ items: mockContentTypeList });

    await waitForUpdate(wrapper);

    expect(wrapper.find(selectors.contentLoader)).not.toExist();
    expect(wrapper.find(selectors.contentTypeList)).toExist();
    expect(wrapper.find(selectors.searchBox)).toExist();
    expect(wrapper.find(selectors.statusFilter)).toExist();

    expect(wrapper.find(selectors.contentTypeList).props().contentTypes).toEqual(
      mockContentTypeList
    );
  });

  it('renders empty page if no content types loaded', async () => {
    const [wrapper] = mount({ items: [] });

    await waitForUpdate(wrapper);

    expect(wrapper.find(selectors.contentTypeList)).not.toExist();
    expect(wrapper.find(selectors.emptyState)).toExist();
  });

  describe('Search Box', () => {
    let wrapper;
    const contentTypes = [
      contentTypeFactory.createPublished({ name: 'aaa' }),
      contentTypeFactory.createPublished({ name: 'bbb' })
    ];

    function setSearchValueAndUpdate(value) {
      wrapper.find(selectors.searchBox).simulate('change', { target: { value } });

      // we need to simulate timers because search box change event is debounced
      jest.runAllTimers();
      wrapper.update();
    }

    beforeEach(async () => {
      const [page] = mount({
        items: contentTypes
      });

      await waitForUpdate(page);
      wrapper = page;
    });

    it('filters results by search box value', async () => {
      setSearchValueAndUpdate('a');

      expect(wrapper.find(selectors.contentTypeList).props().contentTypes).toEqual([
        contentTypes[0]
      ]);
    });

    it('renders no results', async () => {
      setSearchValueAndUpdate('x');

      expect(wrapper.find(selectors.contentTypeList)).not.toExist();
      expect(wrapper.find(selectors.noSearchResults)).toExist();
    });
  });

  describe('Status filter', () => {
    let wrapper;

    const contentTypesByStatus = {
      draft: [contentTypeFactory.createDraft(), contentTypeFactory.createDraft()],
      published: [contentTypeFactory.createPublished(), contentTypeFactory.createPublished()],
      updated: [contentTypeFactory.createUpdated()]
    };

    const contentTypes = flatten(Object.values(contentTypesByStatus));

    beforeEach(async () => {
      const [page] = mount({
        items: contentTypes
      });

      await waitForUpdate(page);
      wrapper = page;
    });

    it('highlights default status (All) after page load', async () => {
      expect(wrapper.find(selectors.statusFilter).props().status).toBeUndefined();
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
        wrapper
          .find(selectors.statusFilter)
          .find(`[data-test-id="status-${status}"]`)
          .simulate('click');

        await waitForUpdate(wrapper);

        expect(wrapper.find(selectors.contentTypeList)).toExist();
        expect(wrapper.find(selectors.contentTypeList).props().contentTypes).toEqual(
          expectedResult
        );
      });
    });
  });
});
