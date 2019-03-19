import React from 'react';
import Enzyme from 'enzyme';
import TranslationWidgetContainer from './TranslationWidgetContainer.es6';
import TranslationWidget from './TranslationWidget.es6';
import TheLocaleStoreMocked from 'ng/TheLocaleStore';
import ModalLauncherMocked from 'app/common/ModalLauncher.es6';
import { track } from 'analytics/Analytics.es6';

jest.mock(
  'ng/TheLocaleStore',
  () => ({
    getLocales: jest
      .fn()
      .mockImplementation(() => [
        { code: 'en-US', default: true, name: 'English (United States)' },
        { code: 'ru', default: false, name: 'Russian' }
      ]),
    getActiveLocales: jest
      .fn()
      .mockImplementation(() => [
        { code: 'en-US', default: true, name: 'English (United States)' },
        { code: 'ru', default: false, name: 'Russian' }
      ]),
    getPrivateLocales: jest
      .fn()
      .mockImplementation(() => [
        { code: 'en-US', default: true, name: 'English (United States)' },
        { code: 'ru', default: false, name: 'Russian' }
      ]),
    setActiveLocales: jest.fn(),
    deactivateLocale: jest.fn(),
    isLocaleActive: jest.fn().mockImplementation(() => false),
    getFocusedLocale: jest.fn().mockImplementation(() => ({})),
    isSingleLocaleModeOn: jest.fn()
  }),
  { virtual: true }
);

jest.mock('app/common/ModalLauncher.es6', () => ({
  open: jest.fn()
}));

describe('EntrySidebar/TranslationWidgetContainer', () => {
  const selectors = {
    changeLink: '[data-test-id="change-translation"]',
    deactivateBtn: '[data-test-id="deactivate-translation"]'
  };

  beforeEach(() => {
    TheLocaleStoreMocked.getLocales.mockClear();
    TheLocaleStoreMocked.getActiveLocales.mockClear();
    TheLocaleStoreMocked.setActiveLocales.mockClear();
    TheLocaleStoreMocked.deactivateLocale.mockClear();
    TheLocaleStoreMocked.getFocusedLocale.mockClear();
    TheLocaleStoreMocked.isSingleLocaleModeOn.mockClear();
    track.mockClear();
  });

  const props = {
    emitter: {
      emit: jest.fn()
    }
  };

  const render = () => Enzyme.mount(<TranslationWidgetContainer {...props} />);

  it('should fetch active locales from TheLocaleStore on initial render', async () => {
    TheLocaleStoreMocked.getActiveLocales.mockReturnValueOnce([]);
    render();
    await Promise.resolve();
    expect(TheLocaleStoreMocked.getActiveLocales).toHaveBeenCalledTimes(1);
  });

  it('should remove locale from TheLocaleStore and refetch the list if deactivate locale was clicked', async () => {
    const locales = [{ code: 'en-US', default: true }, { code: 'ru', default: false }];
    TheLocaleStoreMocked.getActiveLocales.mockReturnValue(locales);
    const wrapper = render();
    await Promise.resolve();
    expect(TheLocaleStoreMocked.getActiveLocales).toHaveBeenCalledTimes(1);
    wrapper.update();
    wrapper.find(selectors.deactivateBtn).simulate('click');
    expect(TheLocaleStoreMocked.deactivateLocale).toHaveBeenCalledWith(locales[1]);
    expect(TheLocaleStoreMocked.getActiveLocales).toHaveBeenCalledTimes(2);
  });

  describe('on change', () => {
    beforeEach(async () => {
      await render()
        .find(TranslationWidget)
        .prop('onChange')();
      const [[callback]] = ModalLauncherMocked.open.mock.calls;
      const localeSelectDialog = callback({});
      const {
        props: { onUpdate }
      } = localeSelectDialog;
      onUpdate([
        { code: 'en-US', active: false, name: 'English (United States)' },
        { code: 'ru', active: true, name: 'Russian' },
        { code: 'es-AR', active: false, name: 'Spanish (Argentina)' }
      ]);
    });

    it('sets the active locales', () => {
      expect(TheLocaleStoreMocked.setActiveLocales).toHaveBeenCalledWith([
        { code: 'ru', active: true, name: 'Russian' }
      ]);
    });

    it('tracks the update event', async () => {
      expect(track).toHaveBeenCalledWith('translation_sidebar:update_active_locales', {
        currentMode: 'multiple'
      });
    });
  });
});
