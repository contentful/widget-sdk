import React from 'react';
import _ from 'lodash';
import TranslationWidget from './TranslationWidget.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import LocaleSelectDialog from './LocaleSelectDialog.es6';
import { PropTypes } from 'prop-types';
import { track } from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

/**
 * Returns an array of copies of `locales` with an additional
 * `active` property.
 */
function getLocalesWithActiveFlag(locales) {
  return _.map(locales, function(locale) {
    return _.extend(
      {
        active: TheLocaleStore.isLocaleActive(locale)
      },
      locale
    );
  });
}

export default class TranslationWidgetContainer extends React.Component {
  static propTypes = {
    emitter: PropTypes.shape({
      emit: PropTypes.func.isRequired
    }).isRequired,
    localeErrors: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      locales: []
    };
  }

  componentDidMount() {
    this.updateLocales();
  }

  updateLocales = () => {
    this.setState({
      locales: TheLocaleStore.getActiveLocales()
    });
  };

  onChange = async () => {
    const locales = getLocalesWithActiveFlag(TheLocaleStore.getPrivateLocales());

    const onUpdate = locales => {
      const activeLocales = locales.filter(locale => locale.active);
      TheLocaleStore.setActiveLocales(activeLocales);
      this.updateLocales();
      track('translation_sidebar:update_active_locales', { currentMode: 'multiple' });
    };

    await ModalLauncher.open(({ onClose, isShown }) => (
      <LocaleSelectDialog
        initialLocales={locales}
        isShown={isShown}
        onClose={onClose}
        onUpdate={onUpdate}
      />
    ));
  };

  onLocaleDeactivation = locale => {
    TheLocaleStore.deactivateLocale(locale);
    this.updateLocales();
    track('translation_sidebar:deselect_active_locale', { currentMode: 'multiple' });
  };

  render() {
    return (
      <TranslationWidget
        locales={this.state.locales}
        onChange={this.onChange}
        onLocaleDeactivation={this.onLocaleDeactivation}
        emitter={this.props.emitter}
        localeErrors={this.props.localeErrors}
      />
    );
  }
}
