import React from 'react';
import TranslationWidget from './TranslationWidget.es6';
import Enzyme from 'enzyme';

describe('EntrySidebar/TranslationWidget', () => {
  const selectors = {
    changeLink: '[data-test-id="change-translation"]',
    deactivateBtn: '[data-test-id="deactivate-translation"]'
  };

  const render = (props = {}, renderFn = Enzyme.mount) => {
    const stubs = {
      onChange: jest.fn(),
      onLocaleDeactivation: jest.fn()
    };
    const locales = [
      { code: 'en-US', default: true, name: 'English (United States)' },
      { code: 'ru', default: false, name: 'Russian' }
    ];
    const wrapper = renderFn(
      <TranslationWidget
        locales={locales}
        onChange={stubs.onChange}
        onLocaleDeactivation={stubs.onLocaleDeactivation}
        {...props}
      />
    );
    return { wrapper, stubs, locales };
  };

  it('should match snaphot', () => {
    const { wrapper } = render({}, Enzyme.shallow);
    expect(wrapper).toMatchSnapshot();
  });

  it('should call onChange after click on changeLink', () => {
    const { wrapper, stubs } = render();
    wrapper.find(selectors.changeLink).simulate('click');
    expect(stubs.onChange).toHaveBeenCalledWith();
  });

  it('should call onLocaleDeactivation after click on close on a language pill', () => {
    const { wrapper, stubs, locales } = render();
    expect(wrapper.find(selectors.deactivateBtn)).toHaveLength(1);
    wrapper.find(selectors.deactivateBtn).simulate('click');
    expect(stubs.onLocaleDeactivation).toHaveBeenCalledWith(locales[1]);
  });
});
