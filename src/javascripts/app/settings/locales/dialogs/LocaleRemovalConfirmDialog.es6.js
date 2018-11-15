import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/ui-component-library';

export default class LocaleRemovalConfirmDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    locale: PropTypes.object.isRequired,
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
    const { locale } = this.props;
    return (
      <ModalConfirm
        isShown={this.props.isShown}
        onCancel={this.props.onCancel}
        onConfirm={this.props.onConfirm}
        shouldCloseOnOverlayClick={false}
        title={`You're about to delete the ${locale.name} (${locale.code}) locale`}
        intent="negative"
        isConfirmDisabled={this.state.typedLocaleCode !== locale.code}
        confirmLabel="Delete"
        cancelLabel="Don't delete"
        confirmTestId="delete-locale-confirm"
        cancelTestId="delete-locale-cancel">
        <p>
          This will break any API clients that rely on <code>{locale.code}</code> existing.
        </p>
        <p>
          <strong>Please note that this action is permanent and you cannot undo it.</strong>
        </p>
        <p>Please type the locale code below to confirm this change:</p>
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
