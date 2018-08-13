import React from 'react';
import PropTypes from 'prop-types';
import {byName as colors} from 'Styles/Colors';

class ViewTypeOption extends React.Component {
  static propTypes = {
    label: PropTypes.node.isRequired,
    description: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    select: PropTypes.func.isRequired
  };

  render () {
    const {label, description, checked, select} = this.props;
    return <li onClick={select} style={{cursor: 'pointer', maxHeight: '50px'}}>
      <input
        type="radio"
        checked={checked}
        readOnly={true}
      />
      <span style={{marginLeft: '5px'}}>
        <label>{label}</label>
        <p style={{marginLeft: '22px', color: colors.textLight}}>{description}</p>
      </span>
    </li>;
  }
}

export default class SaveViewDialog extends React.Component {
  static propTypes = {
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    maxLength: PropTypes.number.isRequired,
    allowViewTypeSelection: PropTypes.bool.isRequired,
    setSaveAsShared: PropTypes.func.isRequired,
    isShared: PropTypes.bool.isRequired,
    trimmed: PropTypes.string.isRequired,
    minLength: PropTypes.number.isRequired,
    confirmLabel: PropTypes.string.isRequired
  };

  render () {
    const {
      confirm,
      cancel,
      value,
      onChange,
      onKeyDown,
      maxLength,
      allowViewTypeSelection,
      setSaveAsShared,
      isShared,
      trimmed,
      minLength,
      confirmLabel
    } = this.props;

    return <div className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>Save as view</h1>
        <button className="modal-dialog__close" onClick={cancel}/>
      </header>
      <div className="modal-dialog__content">
        <p className="modal-dialog__richtext" style={{marginBottom: '25px'}}>
          A view displays a list of entries you searched for. By saving the current view, you will be able to re-use it
          later.
        </p>
        <span>Name of the view<span className="modal-dialog__richtext"> (required)</span></span>
        <input
          className="cfnext-form__input--full-size"
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          maxLength={`${maxLength}`}
          style={{marginTop: '5px'}}
        />
        {allowViewTypeSelection &&
        <ul style={{marginTop: '20px'}}>
          <ViewTypeOption
            label={<React.Fragment>Save under <em>My views</em></React.Fragment>}
            description="Only you will see this view."
            select={() => setSaveAsShared(false)}
            checked={!isShared}
          />
          <ViewTypeOption
            label={<React.Fragment>Save under <em>Shared views</em></React.Fragment>}
            description="You can select which roles should see this view in the next step."
            select={() => setSaveAsShared(true)}
            checked={isShared}
          />
        </ul>
        }
      </div>
      <div className="modal-dialog__controls">
        <button className="btn-primary-action" onClick={confirm} disabled={trimmed.length < minLength}>
          {confirmLabel}
        </button>
        <button className="btn-secondary-action" onClick={cancel}>Cancel</button>
      </div>
    </div>;
  }
}
