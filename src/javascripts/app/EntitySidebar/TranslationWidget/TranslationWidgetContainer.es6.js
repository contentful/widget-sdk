import React from 'react';
import { getModule } from 'NgRegistry.es6';
import TranslationWidget from './TranslationWidget.es6';

const TheLocaleStore = getModule('TheLocaleStore');

export default class TranslationWidgetContainer extends React.Component {
  onChange = () => {
    // todo: open modal dialog
  };

  render() {
    const locales = TheLocaleStore.getActiveLocales();

    return (
      <TranslationWidget
        locales={locales}
        onChange={this.onChange}
        onLocaleDeactivation={locale => {
          TheLocaleStore.deactivateLocale(locale);
        }}
      />
    );
  }
}
