import React from 'react';
import Enzyme from 'enzyme';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import TranslationWidgetPills from './TranslationWidgetPills.es6';
import ModalLauncherMocked from 'app/common/ModalLauncher.es6';
import { TextLink, Pill } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';

jest.mock('app/common/ModalLauncher.es6', () => ({
  open: jest.fn()
}));

describe('EntrySidebar/TranslationWidgetPills', () => {
  const locales = [
    { code: 'en', default: true },
    { code: 'de', default: false },
    { code: 'es', default: false },
    { code: 'ru', default: false }
  ];

  const props = {
    emitter: {
      emit: jest.fn()
    },
    localeData: {
      activeLocales: locales,
      privateLocales: locales,
      isLocaleActive: ({ code }) => ['es-AR', 'ru'].includes(code)
    }
  };

  const render = () => Enzyme.shallow(<TranslationWidgetPills {...props} />);

  beforeEach(() => {
    props.emitter.emit.mockClear();
  });

  it('should match snapshot', () => {
    expect(render()).toMatchSnapshot();
  });

  describe('on locale deactivation', () => {
    beforeEach(() => {
      render()
        .find('.entity-sidebar__translation-pill')
        .at(1)
        .find(Pill)
        .prop('onClose')();
    });

    it('emits the DEACTIVATED_LOCALE event with the locale', () => {
      expect(props.emitter.emit).toHaveBeenCalledWith(
        SidebarEventTypes.DEACTIVATED_LOCALE,
        props.localeData.activeLocales[1]
      );
    });

    it('tracks the update event', () => {
      expect(track).toHaveBeenCalledWith('translation_sidebar:deselect_active_locale', {
        currentMode: 'multiple',
        previousActiveLocaleCount: 4,
        currentActiveLocaleCount: 3
      });
    });
  });

  describe('on change', () => {
    beforeEach(async () => {
      await render()
        .find(TextLink)
        .prop('onClick')();
      const [[callback]] = ModalLauncherMocked.open.mock.calls;
      const localeSelectDialog = callback({});
      const {
        props: { onUpdate }
      } = localeSelectDialog;
      onUpdate([
        { code: 'en-US', active: false },
        { code: 'es-AR', active: true },
        { code: 'ru', active: true },
        { code: 'de-DE', active: false }
      ]);
    });

    it('emits the SET_ACTIVE_LOCALES event with the new active locales', () => {
      expect(props.emitter.emit).toHaveBeenCalledWith(SidebarEventTypes.SET_ACTIVE_LOCALES, [
        { code: 'es-AR', active: true },
        { code: 'ru', active: true }
      ]);
    });

    it('tracks the update event', () => {
      expect(track).toHaveBeenCalledWith('translation_sidebar:update_active_locales', {
        currentMode: 'multiple',
        previousActiveLocaleCount: 4,
        currentActiveLocaleCount: 2
      });
    });
  });
});
