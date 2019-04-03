import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import LocaleSelectDialog from './LocaleSelectDialog.es6';
import { Pill, TextLink } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics.es6';
import { orderBy } from 'lodash';

const sortLocales = locales => orderBy(locales, ['default', 'code'], ['desc', 'asc']);

const trackTranslationSidebarEvent = (action, data) =>
  track(`translation_sidebar:${action}`, {
    currentMode: 'multiple',
    ...data
  });

const localesPropType = PropTypes.arrayOf(
  PropTypes.shape({
    code: PropTypes.string.isRequired,
    default: PropTypes.bool.isRequired
  }).isRequired
).isRequired;

export default class TranslationWidgetPills extends Component {
  static propTypes = {
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    localeData: PropTypes.shape({
      activeLocales: localesPropType,
      privateLocales: localesPropType,
      isLocaleActive: PropTypes.func.isRequired
    })
  };

  onLocaleDeactivation = locale => {
    const activeLocaleCount = this.props.localeData.activeLocales.length;
    trackTranslationSidebarEvent('deselect_active_locale', {
      previousActiveLocaleCount: activeLocaleCount,
      currentActiveLocaleCount: activeLocaleCount - 1
    });
    this.props.emitter.emit(SidebarEventTypes.DEACTIVATED_LOCALE, locale);
  };

  onChange = async () => {
    const { privateLocales, isLocaleActive } = this.props.localeData;

    const initialLocales = privateLocales.map(locale => ({
      ...locale,
      active: isLocaleActive(locale)
    }));

    const onUpdate = locales => {
      const currentActiveLocales = locales.filter(l => l.active);
      trackTranslationSidebarEvent('update_active_locales', {
        previousActiveLocaleCount: this.props.localeData.activeLocales.length,
        currentActiveLocaleCount: currentActiveLocales.length
      });
      this.props.emitter.emit(SidebarEventTypes.SET_ACTIVE_LOCALES, currentActiveLocales);
    };

    await ModalLauncher.open(({ onClose, isShown }) => (
      <LocaleSelectDialog
        initialLocales={initialLocales}
        isShown={isShown}
        onClose={onClose}
        onUpdate={onUpdate}
      />
    ));
  };

  render() {
    return (
      <div className="pill-list entity-sidebar__translation-pills">
        {sortLocales(this.props.localeData.activeLocales).map(locale => (
          <div
            key={locale.code}
            className={classNames('entity-sidebar__translation-pill', {
              'x--default': locale.default
            })}>
            <Pill
              testId="deactivate-translation"
              status="default"
              label={locale.code}
              onClose={locale.default ? undefined : () => this.onLocaleDeactivation(locale)}
            />
          </div>
        ))}
        <TextLink testId="change-translation" onClick={this.onChange}>
          Change
        </TextLink>
      </div>
    );
  }
}
