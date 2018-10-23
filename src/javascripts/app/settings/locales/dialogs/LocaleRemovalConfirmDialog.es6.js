import React from 'react';
import PropTypes from 'prop-types';
import { Button, TextInput } from '@contentful/ui-component-library';

export default class LocaleRemovalConfirmDialog extends React.Component {
  static propTypes = {
    locale: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  state = {
    typedLocaleCode: ''
  };

  render() {
    const { locale } = this.props;
    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>
            You’re about to delete the{' '}
            <em>
              {locale.name} ({locale.code})
            </em>{' '}
            locale.
          </h1>
          <button
            data-test-id="modal-dialog-close"
            className="modal-dialog__close"
            onClick={this.props.onCancel}
          />
        </header>
        <div className="modal-dialog__content">
          <div className="modal-dialog__richtext">
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
          </div>
        </div>
        <div className="modal-dialog__controls">
          <Button
            testId="delete-locale-confirm"
            buttonType="negative"
            onClick={this.props.onConfirm}
            disabled={this.state.typedLocaleCode !== locale.code}>
            Delete
          </Button>
          <Button testId="delete-locale-cancel" buttonType="muted" onClick={this.props.onCancel}>
            Don’t delete
          </Button>
        </div>
      </div>
    );
  }
}
