import React from 'react';
import Enzyme from 'enzyme';

import Page from './ContentTypeListPage.es6';

import * as spaceContextMocked from 'ng/spaceContext';
import flushPromises from 'testHelpers/flushPromises';
import { createContentType } from 'testHelpers/contentTypeFactory';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' })
}));

jest.mock('./ContentTypeList/index.es6');

jest.mock(
  'access_control/AccessChecker/index.es6',
  () => ({
    shouldHide: jest.fn().mockReturnValue(false),
    shouldDisable: jest.fn().mockReturnValue(false),
    Action: { CREATE: 'Create' }
  }),
  { virtual: true }
);

describe('ContentTypeListPage', () => {
  const selectors = {
    contentLoader: '[data-test-id="content-loader"]',
    contentTypeList: '[data-test-id="content-type-list"]',
    emptyState: '[data-test-id="empty-state"]',
    noSearchResults: '[data-test-id="no-search-results"]'
  };

  const mockContentTypeList = [createContentType(), createContentType(), createContentType()];

  function mountAndStub(mock) {
    const getStub = jest.fn().mockResolvedValue(mock);
    spaceContextMocked.endpoint = getStub;

    return [Enzyme.mount(<Page />), getStub];
  }

  it('renders loader', () => {
    const [wrapper, getStub] = mountAndStub({ items: mockContentTypeList });

    expect(getStub).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.contentLoader)).toExist();
  });

  it('renders results once loaded', async () => {
    const [wrapper] = mountAndStub({ items: mockContentTypeList });

    await flushPromises();
    wrapper.update();

    expect(wrapper.find(selectors.contentLoader)).not.toExist();
    expect(wrapper.find(selectors.contentTypeList)).toExist();

    expect(wrapper.find(selectors.contentTypeList).props().contentTypes).toEqual(
      mockContentTypeList
    );
  });

  it('renders empty page if no content types loaded', async () => {
    const [wrapper] = mountAndStub({ items: [] });

    await flushPromises();
    wrapper.update();

    expect(wrapper.find(selectors.contentTypeList)).not.toExist();
    expect(wrapper.find(selectors.emptyState)).toExist();
  });
});
