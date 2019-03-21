import React from 'react';
import Enzyme from 'enzyme';
import TranslationWidget from './TranslationWidget.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { track } from 'analytics/Analytics.es6';

describe('EntrySidebar/TranslationWidget', () => {
  const locales = [
    { internal_code: 'en-US', default: true },
    { internal_code: 'de-DE', default: false },
    { internal_code: 'es-AR', default: false },
    { internal_code: 'ru', default: false }
  ];

  const props = {
    localeData: {
      activeLocales: locales,
      privateLocales: locales,
      errors: {},
      focusedLocale: locales[0],
      isLocaleActive: () => {},
      isSingleLocaleModeOn: false,
      isSingleLocaleModeSupported: false
    },
    emitter: {
      emit: jest.fn()
    }
  };
  const render = () => Enzyme.shallow(<TranslationWidget {...props} />);

  describe('when single locale mode is not supported', () => {
    beforeEach(() => {
      props.localeData.isSingleLocaleModeSupported = false;
    });

    describe('when single locale mode is on', () => {
      beforeEach(() => {
        props.localeData.isSingleLocaleModeOn = true;
      });

      it('should match snapshot', () => {
        expect(render()).toMatchSnapshot();
      });
    });

    describe('when single locale mode is off', () => {
      beforeEach(() => {
        props.localeData.isSingleLocaleModeOn = false;
      });

      it('should match snapshot', () => {
        expect(render()).toMatchSnapshot();
      });
    });
  });

  describe('when single locale mode is supported', () => {
    beforeEach(() => {
      props.localeData.isSingleLocaleModeSupported = true;
    });

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
});
