import React from 'react';
import PropTypes from 'prop-types';
import { Button, TextInput } from '@contentful/ui-component-library';

const LocaleType = PropTypes.shape({
  code: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

export default class LocaleCodeChangeConfirmDialog extends React.Component {
  static propTypes = {
    previousLocale: LocaleType.isRequired,
    locale: LocaleType.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  state = {
    typedLocaleCode: ''
  };

  render() {
    const { locale, previousLocale } = this.props;
    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>Changing a locale might break things</h1>
          <button
            data-test-id="modal-dialog-close"
            className="modal-dialog__close"
            onClick={this.props.onCancel}
          />
        </header>
        <div className="modal-dialog__content">
          <div className="modal-dialog__richtext">
            <p>
              You’re about to change <strong>{previousLocale.name}</strong> to{' '}
              <strong>{locale.name}</strong>, which might break localisation in your apps. If you’re
              using the locale code <code>{previousLocale.code}</code> in your API clients, make
              sure you update it to <code>{locale.code}</code>. You can revert these changes
              afterwards. Please type the old locale code below:
            </p>
            <TextInput
              id="localeInput"
              name="localeInput"
              width="medium"
              testId="repeat-locale-input"
              value={this.state.typedLocaleCode}
              onChange={e => {
                this.setState({ typedLocaleCode: e.target.value });
              }}
            />
          </div>
        </div>
        <div className="modal-dialog__controls">
          <Button
            testId="change-locale-confirm"
            buttonType="positive"
            onClick={this.props.onConfirm}
            disabled={this.state.typedLocaleCode !== previousLocale.code}>
            Got it, change locale
          </Button>
          <Button testId="change-locale-cancel" buttonType="muted" onClick={this.props.onCancel}>
            No, I need some more time
          </Button>
        </div>
      </div>
    );
  }
}
