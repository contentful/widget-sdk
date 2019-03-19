import React from 'react';
import Enzyme from 'enzyme';
import TranslationWidgetDropdown from './TranslationWidgetDropdown.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import { track } from 'analytics/Analytics.es6';
import { Select } from '@contentful/forma-36-react-components';
import TheLocaleStoreMocked from 'ng/TheLocaleStore';

jest.mock(
  'ng/TheLocaleStore',
  () => ({
    getLocales: jest
      .fn()
      .mockImplementation(() => [
        { internal_code: 'en-US', default: true, name: 'English (United States)' },
        { internal_code: 'ru', default: false, name: 'Russian' }
      ]),
    getFocusedLocale: jest.fn().mockImplementation(() => ({
      internal_code: 'en-US',
      default: true,
      name: 'English (United States)'
    }))
  }),
  { virtual: true }
);

describe('EntrySidebar/TranslationWidgetDropdown', () => {
  const props = {
    emitter: {
      emit: jest.fn()
    },
    localeErrors: {}
  };

  const render = () => Enzyme.shallow(<TranslationWidgetDropdown {...props} />);

  beforeEach(() => {
    TheLocaleStoreMocked.getLocales.mockClear();
    TheLocaleStoreMocked.getFocusedLocale.mockClear();
    track.mockClear();
  });

  describe('when there are no locale errors', () => {
    beforeEach(() => {
      props.localeErrors = {};
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('when a locale has 1 error', () => {
    beforeEach(() => {
      props.localeErrors = {
        'en-US': [{}]
      };
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('when a locale has more than one 1 error', () => {
    beforeEach(() => {
      props.localeErrors = {
        'en-US': [{}, {}]
      };
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('when both locales have errors', () => {
    beforeEach(() => {
      props.localeErrors = {
        'en-US': [{}, {}],
        ru: [{}]
      };
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('on change', () => {
    beforeEach(() => {
      const wrapper = render();
      wrapper.find(Select).prop('onChange')({ target: { value: 'ru' } });
    });

    it('emits the UPDATE_FOCUSED_LOCALE event with the new locale', () => {
      expect(props.emitter.emit).toHaveBeenCalledWith(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, {
        internal_code: 'ru',
        default: false,
        name: 'Russian'
      });
    });

    it('tracks the change event', () => {
      expect(track).toHaveBeenCalledWith('translation_sidebar:change_focused_locale', {
        currentMode: 'single'
      });
    });
  });
});
