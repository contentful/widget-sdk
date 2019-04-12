import React from 'react';
import Enzyme from 'enzyme';
import TranslationWidget from './TranslationWidget.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { track } from 'analytics/Analytics.es6';

describe('EntrySidebar/TranslationWidget', () => {
  const locales = [
    { internal_code: 'en-US', code: 'en', name: 'English (United States)', default: true },
    { internal_code: 'de-DE', code: 'de', name: 'German (Germany)', default: false },
    { internal_code: 'es-AR', code: 'es', name: 'Spanish (Argentina)', default: false },
    { internal_code: 'ru', code: 'ru', name: 'Russian', default: false }
  ];

  const props = {
    localeData: {
      activeLocales: locales,
      privateLocales: locales,
      errors: {},
      focusedLocale: locales[0],
      isLocaleActive: () => {},
      isSingleLocaleModeOn: false
    },
    emitter: {
      emit: jest.fn()
    }
  };
  const render = () => Enzyme.shallow(<TranslationWidget {...props} />);

  describe('when single locale mode is on', () => {
    beforeEach(() => {
      props.localeData.isSingleLocaleModeOn = true;
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });

    describe('and the locale mode is change', () => {
      beforeEach(() => {
        const headerNode = Enzyme.shallow(
          render()
            .find(EntrySidebarWidget)
            .prop('headerNode')
        );
        headerNode.find('select').prop('onChange')({ target: { value: 'multiple' } });
      });

      it('emits the SET_SINGLE_LOCALE_MODE event with the new value', () => {
        expect(props.emitter.emit).toHaveBeenCalledWith(
          SidebarEventTypes.SET_SINGLE_LOCALE_MODE,
          false
        );
      });

      it('tracks the change event', () => {
        expect(track).toHaveBeenCalledWith('translation_sidebar:toggle_widget_mode', {
          currentMode: 'multiple'
        });
      });
    });
  });

  describe('when single locale mode is off', () => {
    beforeEach(() => {
      props.localeData.isSingleLocaleModeOn = false;
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });

    describe('and the locale mode is changed', () => {
      beforeEach(() => {
        const headerNode = Enzyme.shallow(
          render()
            .find(EntrySidebarWidget)
            .prop('headerNode')
        );
        headerNode.find('select').prop('onChange')({ target: { value: 'single' } });
      });

      it('emits the SET_SINGLE_LOCALE_MODE event with the new value', () => {
        expect(props.emitter.emit).toHaveBeenCalledWith(
          SidebarEventTypes.SET_SINGLE_LOCALE_MODE,
          true
        );
      });

      it('tracks the change event', () => {
        expect(track).toHaveBeenCalledWith('translation_sidebar:toggle_widget_mode', {
          currentMode: 'single'
        });
      });
    });
  });
});
