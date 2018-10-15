import React from 'react';
import PropTypes from 'prop-types';
import keycodes from 'utils/keycodes.es6';

export default class InputDialog extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      message: PropTypes.string,
      title: PropTypes.string
    }).isRequired,
    onCancel: PropTypes.func.isRequired,
    initialValue: PropTypes.string.isRequired,
    onConfirm: PropTypes.func.isRequired,
    maxLength: PropTypes.number,
    isValid: PropTypes.bool.isRequired
  };

  static defaultProps = {
    maxLength: undefined
  };

  constructor(props) {
    super(props);

    this.state = { value: props.initialValue };
  }

  onKeyDown = e => e.keyCode === keycodes.ENTER && this.props.onConfirm(this.state.value);

  render() {
    const { params, onConfirm, onCancel, maxLength, isValid } = this.props;
    const { value } = this.state;
    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>{params.title}</h1>
          <button className="modal-dialog__close" onClick={onCancel} />
        </header>
        <div className="modal-dialog__content">
          <p
            className="modal-dialog__richtext"
            dangerouslySetInnerHTML={{ __html: params.message }}
          />
          <input
            className="cfnext-form__input--full-size"
            type="text"
            value={value}
            onChange={({ target: { value } }) => this.setState({ value })}
            onKeyDown={this.onKeyDown}
            maxLength={maxLength ? `${maxLength}` : ''}
          />
        </div>
        <div className="modal-dialog__controls">
          <button
            className="btn-primary-action"
            onClick={() => onConfirm(this.state.value)}
            disabled={!isValid}>
            {params.confirmLabel || 'OK'}
          </button>
          <button className="btn-secondary-action" onClick={onCancel}>
            {params.cancelLabel || 'Cancel'}
          </button>
        </div>
      </div>
    );
  }
}
