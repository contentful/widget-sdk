import React from 'react';
import PropTypes from 'prop-types';
import { Button, Select, Option } from '@contentful/ui-component-library';

const LocaleType = PropTypes.shape({
  code: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

export default class ChooseNewFallbackLocaleDialog extends React.Component {
  static propTypes = {
    locale: LocaleType.isRequired,
    availableLocales: PropTypes.arrayOf(LocaleType.isRequired).isRequired,
    dependantLocaleNames: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  state = {
    newFallbackCode: ''
  };

  render() {
    const { locale, dependantLocaleNames, availableLocales } = this.props;
    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>You’re deleting a locale used as fallback</h1>
          <button
            className="modal-dialog__close"
            data-test-id="modal-dialog-close"
            onClick={this.props.onCancel}
          />
        </header>
        <div className="modal-dialog__content">
          <div className="modal-dialog__richtext">
            <p>
              <strong>{locale.name}</strong> is used as fallback for{' '}
              <code>{dependantLocaleNames}</code>. After deleting it, the affected locales will
              fallback to:
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
          </div>
        </div>
        <div className="modal-dialog__controls">
          <Button
            testId="choose-locale-confirm"
            buttonType="positive"
            onClick={() => this.props.onConfirm(this.state.newFallbackCode)}>
            OK, delete {locale.name} and update affected locales
          </Button>
          <Button testId="choose-locale-cancel" buttonType="muted" onClick={this.props.onCancel}>
            Don’t delete
          </Button>
        </div>
      </div>
    );
  }
}
