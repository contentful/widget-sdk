import React from 'react';
import Enzyme from 'enzyme';
import TranslationWidgetPills from './TranslationWidgetPills.es6';

describe('EntrySidebar/TranslationWidgetPills', () => {
  const selectors = {
    changeLink: '[data-test-id="change-translation"]',
    deactivateBtn: '[data-test-id="deactivate-translation"]'
  };

  const locales = [
    { code: 'en-US', default: true, name: 'English (United States)' },
    { code: 'ru', default: false, name: 'Russian' }
  ];

  const stubs = {
    onChange: jest.fn(),
    onLocaleDeactivation: jest.fn()
  };

  const props = {
    locales,
    ...stubs
  };

  const render = () => ({
    wrapper: Enzyme.mount(<TranslationWidgetPills {...props} />),
    stubs,
    locales
  });

  beforeEach(() => {
    Object.values(stubs).map(mock => mock.mockClear());
  });

  it('should call onChange after click on changeLink', () => {
    const { wrapper, stubs } = render();
    wrapper.find(selectors.changeLink).simulate('click');
    expect(stubs.onChange).toHaveBeenCalled();
  });

  it('should call onLocaleDeactivation after click on close on a language pill', () => {
    const { wrapper, stubs, locales } = render();
    expect(wrapper.find(selectors.deactivateBtn)).toHaveLength(1);
    wrapper.find(selectors.deactivateBtn).simulate('click');
    expect(stubs.onLocaleDeactivation).toHaveBeenCalledWith(locales[1]);
  });
});
