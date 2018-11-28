import React from 'react';
import PropTypes from 'prop-types';
import { Select, Option, ModalConfirm } from '@contentful/forma-36-react-components';

const LocaleType = PropTypes.shape({
  code: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

export default class ChooseNewFallbackLocaleDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    locale: LocaleType.isRequired,
    availableLocales: PropTypes.arrayOf(LocaleType.isRequired).isRequired,
    dependantLocales: PropTypes.arrayOf(LocaleType.isRequired).isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  state = {
    newFallbackCode: ''
  };

  componentDidUpdate(nextProps) {
    if (nextProps.isShown === false) {
      this.setState({ newFallbackCode: '' });
    }
  }

  onConfirm = () => {
    this.props.onConfirm(this.state.newFallbackCode);
  };

  prepareDependantLocaleNames = dependantLocales => {
    if (dependantLocales.length > 4) {
      const rest = ` and ${dependantLocales.length - 3} other locales`;
      return (
        dependantLocales
          .slice(0, 3)
          .map(item => item.name)
          .join(', ') + rest
      );
    } else {
      return dependantLocales.map(item => item.name).join(', ');
    }
  };

  render() {
    const { locale, dependantLocales, availableLocales } = this.props;
    return (
      <ModalConfirm
        isShown={this.props.isShown}
        size="large"
        title="You’re deleting a locale used as fallback"
        onCancel={this.props.onCancel}
        onConfirm={this.onConfirm}
        confirmTestId="choose-locale-confirm"
        cancelTestId="choose-locale-cancel"
        confirmLabel={`OK, delete ${locale.name} and update affected locales`}
        cancelLabel="Don’t delete">
        <p>
          <strong>{locale.name}</strong> is used as fallback for{' '}
          <code>{this.prepareDependantLocaleNames(dependantLocales)}</code>. After deleting it, the
          affected locales will fallback to:
        </p>
        <Select
          id="newFallbackLocale"
          name="newFallbackLocale"
          value={this.state.newFallbackCode}
          testId="choose-fallback-locale-select"
          onChange={e => {
            this.setState({ newFallbackCode: e.target.value });
          }}>
          <Option value="">None (no fallback)</Option>
          {availableLocales.map(locale => (
            <Option key={locale.code} value={locale.code}>
              {locale.name}
            </Option>
          ))}
        </Select>
      </ModalConfirm>
    );
  }
}
