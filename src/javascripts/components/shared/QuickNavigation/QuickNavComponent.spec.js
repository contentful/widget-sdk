import React from 'react';
import Enzyme from 'enzyme';
import QuickNav from './QuickNav.es6';
import { getModule } from 'NgRegistry.es6';

jest.mock('react-modal', () => {
  function ReactModalMock({ children }) {
    return <div className="react-modal">{children}</div>;
  }
  ReactModalMock.setAppElement = jest.fn();
  return ReactModalMock;
});

jest.mock('TheStore/index.es6', () => ({
  getStore: jest.fn()
}));

jest.mock('states/Navigator.es6', () => ({
  href: jest.fn(),
  getCurrentStateName: jest.fn()
}));

jest.mock(
  'ng/EntityHelpers',
  () => ({
    newForLocale: () => ({ entityTitle: () => 'title' })
  }),
  { virtual: true }
);

jest.mock(
  'ng/TheLocaleStore',
  () => ({
    getDefaultLocale: () => ({ code: 'code' })
  }),
  { virtual: true }
);

jest.mock(
  'ng/spaceContext',
  () => ({
    cma: {
      getEntries: jest.fn().mockReturnValue(Promise.resolve({ items: [] })),
      getAssets: jest.fn().mockReturnValue(Promise.resolve({ items: [] }))
    },
    publishedCTs: {
      getAllBare: jest.fn().mockReturnValue([])
    }
  }),
  { virtual: true }
);

jest.mock('access_control/AccessChecker/index.es6', () => ({
  getSectionVisibility: jest.fn().mockReturnValue({ entry: true, asset: true, contentType: true })
}));

describe('shared/QuickNavComponent.es6', () => {
  const spaceContext = getModule('spaceContext');
  let wrapper;
  beforeEach(() => {
    jest.useFakeTimers();
    spaceContext.cma.getEntries.mockClear();
    spaceContext.cma.getAssets.mockClear();
    spaceContext.publishedCTs.getAllBare.mockClear();
    wrapper = Enzyme.mount(<QuickNav />);
  });
  it('should render search button', () => {
    expect(wrapper.find('[data-test-id="quick-nav-search-button"]')).toExist();
  });
  it('should open search onClick', () => {
    wrapper.find('[data-test-id="quick-nav-search-button"]').simulate('click');
    expect(wrapper.find('[testId="quick-nav-search-input"]')).toExist();
  });
  it('should send request if query length is more than one character', () => {
    wrapper.find('[data-test-id="quick-nav-search-button"]').simulate('click');
    wrapper
      .find('[data-test-id="quick-nav-search-input"]')
      .simulate('change', { target: { value: 'foo' } });
    jest.runOnlyPendingTimers();
    expect(spaceContext.cma.getEntries).toHaveBeenCalledTimes(1);
    expect(spaceContext.cma.getAssets).toHaveBeenCalledTimes(1);
    expect(spaceContext.publishedCTs.getAllBare).toHaveBeenCalledTimes(1);
  });
  it('should not send request if query length is less than one character', () => {
    wrapper.find('[data-test-id="quick-nav-search-button"]').simulate('click');
    wrapper
      .find('[data-test-id="quick-nav-search-input"]')
      .simulate('change', { target: { value: 'a' } });
    jest.runOnlyPendingTimers();
    expect(spaceContext.cma.getEntries).toHaveBeenCalledTimes(0);
    expect(spaceContext.cma.getAssets).toHaveBeenCalledTimes(0);
    expect(spaceContext.publishedCTs.getAllBare).toHaveBeenCalledTimes(0);
  });
});
