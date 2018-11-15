import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/ui-component-library';

const LocaleType = PropTypes.shape({
  code: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

export default class LocaleCodeChangeConfirmDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    previousLocale: LocaleType.isRequired,
    locale: LocaleType.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  state = {
    typedLocaleCode: ''
  };

  componentDidUpdate(nextProps) {
    if (nextProps.isShown === false) {
      this.setState({ typedLocaleCode: '' });
    }
  }

  render() {
    const { locale, previousLocale } = this.props;
    return (
      <ModalConfirm
        isShown={this.props.isShown}
        onConfirm={this.props.onConfirm}
        onCancel={this.props.onCancel}
        isConfirmDisabled={this.state.typedLocaleCode !== previousLocale.code}
        intent="positive"
        confirmLabel="Got it, change locale"
        confirmTestId="change-locale-confirm"
        cancelLabel="No, I need some more time"
        cancelTestId="change-locale-cancel">
        <p>
          You’re about to change <strong>{previousLocale.name}</strong> to{' '}
          <strong>{locale.name}</strong>, which might break localisation in your apps. If you’re
          using the locale code <code>{previousLocale.code}</code> in your API clients, make sure
          you update it to <code>{locale.code}</code>. You can revert these changes afterwards.
          Please type the old locale code below:
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
      </ModalConfirm>
    );
  }
}
