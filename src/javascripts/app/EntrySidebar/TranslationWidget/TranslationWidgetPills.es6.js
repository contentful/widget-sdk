import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import LocaleSelectDialog from './LocaleSelectDialog.es6';
import { orderLocales } from 'app/EntrySidebar/TranslationWidget/helpers.es6';
import { Pill, TextLink } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics.es6';

const localesPropType = PropTypes.arrayOf(
  PropTypes.shape({
    internal_code: PropTypes.string.isRequired,
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
    this.props.emitter.emit(SidebarEventTypes.DEACTIVATED_LOCALE, locale);
    track('translation_sidebar:deselect_active_locale', { currentMode: 'multiple' });
  };

  onChange = async () => {
    const { privateLocales, isLocaleActive } = this.props.localeData;

    const initialLocales = privateLocales.map(locale => ({
      ...locale,
      active: isLocaleActive(locale)
    }));

    const onUpdate = locales => {
      const activeLocales = locales.filter(l => l.active);
      this.props.emitter.emit(SidebarEventTypes.SET_ACTIVE_LOCALES, activeLocales);
      track('translation_sidebar:update_active_locales', { currentMode: 'multiple' });
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
        {orderLocales(this.props.localeData.activeLocales).map(locale => (
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
