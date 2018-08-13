import React from 'react';
import PropTypes from 'prop-types';

export default class InputDialog extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      message: PropTypes.string,
      title: PropTypes.string
    }).isRequired,
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    maxLength: PropTypes.number,
    isInvalid: PropTypes.bool.isRequired
  };

  static defaultProps = {
    maxLength: undefined
  };

  render () {
    const {params, confirm, cancel, value, onChange, onKeyDown, maxLength, isInvalid} = this.props;
    return <div className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>{params.title}</h1>
        <button
          className="modal-dialog__close"
          onClick={cancel}
        />
      </header>
      <div className="modal-dialog__content">
        <p
          className="modal-dialog__richtext"
          dangerouslySetInnerHTML={{__html: params.message}}
        />
        <input
          {...{
            className: 'cfnext-form__input--full-size',
            type: 'text',
            value,
            onChange,
            onKeyDown,
            maxLength: maxLength ? `${maxLength}` : ''
          }}
        />
      </div>
      <div className="modal-dialog__controls">
        <button
          className="btn-primary-action"
          onClick={confirm}
          disabled={isInvalid}
        >
          {params.confirmLabel || 'OK'}
        </button>
        <button
          className="btn-secondary-action"
          onClick={cancel}
        >
          {params.cancelLabel || 'Cancel'}
        </button>
      </div>
    </div>;
  }
}
