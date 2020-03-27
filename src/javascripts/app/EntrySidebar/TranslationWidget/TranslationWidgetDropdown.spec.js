import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import TranslationWidgetDropdown from './TranslationWidgetDropdown';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import { Select } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';

describe('EntrySidebar/TranslationWidgetDropdown', () => {
  const props = {
    emitter: {
      emit: jest.fn(),
    },
    localeData: {
      privateLocales: [
        {
          internal_code: 'en-HK',
          code: 'en-HK',
          default: true,
          name: 'English (Hong Kong SAR China)',
        },
        { internal_code: 'ru', code: 'ru', default: false, name: 'Russian' },
        { internal_code: 'ar-AR', code: 'zh', default: false, name: 'Zhao (Azerbaijan)' },
      ],
      focusedLocale: {
        internal_code: 'en-HK',
        code: 'en',
        default: true,
        name: 'English (United States)',
      },
      errors: {},
    },
  };

  const render = () => Enzyme.shallow(<TranslationWidgetDropdown {...props} />);

  beforeEach(() => {
    track.mockClear();
  });

  describe('when there are no locale errors', () => {
    beforeEach(() => {
      props.localeData.errors = {};
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('when a locale has 1 error', () => {
    beforeEach(() => {
      props.localeData.errors = {
        'en-HK': [{}],
      };
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('when a locale has more than one 1 error', () => {
    beforeEach(() => {
      props.localeData.errors = {
        'en-HK': [{}, {}],
      };
    });

    it('should match snapshot', () => {
      expect(render()).toMatchSnapshot();
    });
  });

  describe('when both locales have errors', () => {
    beforeEach(() => {
      props.localeData.errors = {
        'en-HK': [{}, {}],
        ru: [{}],
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
        code: 'ru',
        default: false,
        name: 'Russian',
      });
    });

    it('tracks the change event', () => {
      expect(track).toHaveBeenCalledWith('translation_sidebar:change_focused_locale', {
        currentMode: 'single',
      });
    });
  });
});
