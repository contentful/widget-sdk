import React from 'react';
import Enzyme from 'enzyme';
import TranslationWidgetContainer from './TranslationWidgetContainer.es6';
import TheLocaleStoreMocked from 'ng/TheLocaleStore';

jest.mock(
  'ng/TheLocaleStore',
  () => ({
    getActiveLocales: jest.fn(),
    deactivateLocale: jest.fn()
  }),
  { virtual: true }
);

describe('EntrySidebar/TranslationWidgetContainer', () => {
  const selectors = {
    changeLink: '[data-test-id="change-translation"]',
    deactivateBtn: '[data-test-id="deactivate-translation"]'
  };

  beforeEach(() => {
    TheLocaleStoreMocked.getActiveLocales.mockReset();
    TheLocaleStoreMocked.deactivateLocale.mockReset();
  });

  const render = () => {
    const wrapper = Enzyme.mount(<TranslationWidgetContainer />);
    return { wrapper };
  };

  it('should fetch active locales from TheLocaleStore on initial render', async () => {
    TheLocaleStoreMocked.getActiveLocales.mockReturnValueOnce([]);
    render();
    await Promise.resolve();
    expect(TheLocaleStoreMocked.getActiveLocales).toHaveBeenCalledTimes(1);
  });

  it('should remove locale from TheLocaleStore and refetch the list if deactivate locale was clicked', async () => {
    const locales = [{ code: 'en-US', default: true }, { code: 'ru', default: false }];
    TheLocaleStoreMocked.getActiveLocales.mockReturnValue(locales);
    const { wrapper } = render();
    await Promise.resolve();
    expect(TheLocaleStoreMocked.getActiveLocales).toHaveBeenCalledTimes(1);
    wrapper.update();
    wrapper.find(selectors.deactivateBtn).simulate('click');
    expect(TheLocaleStoreMocked.deactivateLocale).toHaveBeenCalledWith(locales[1]);
    expect(TheLocaleStoreMocked.getActiveLocales).toHaveBeenCalledTimes(2);
  });
});
