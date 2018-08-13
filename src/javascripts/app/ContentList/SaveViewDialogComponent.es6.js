import React from 'react';
import PropTypes from 'prop-types';
import {byName as colors} from 'Styles/Colors';
import keycodes from 'utils/keycodes';

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
    minLength: PropTypes.number.isRequired,
    maxLength: PropTypes.number.isRequired,
    allowViewTypeSelection: PropTypes.bool.isRequired,
    allowRoleAssignment: PropTypes.bool.isRequired
  };

  state = {value: '', isShared: false};

  render () {
    const {
      cancel,
      maxLength,
      allowViewTypeSelection,
      minLength,
      allowRoleAssignment
    } = this.props;
    const {value, isShared} = this.state;

    const trimmed = value.trim();
    const isInvalid = trimmed.length < minLength || trimmed.length > maxLength;
    const confirm = () => !isInvalid && this.props.confirm({title: trimmed, isShared});
    const onKeyDown = e => e.keyCode === keycodes.ENTER && confirm();

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
          onChange={e => this.setState({value: e.target.value})}
          onKeyDown={onKeyDown}
          maxLength={`${maxLength}`}
          style={{marginTop: '5px'}}
        />
        {allowViewTypeSelection &&
        <ul style={{marginTop: '20px'}}>
          <ViewTypeOption
            label={<React.Fragment>Save under <em>My views</em></React.Fragment>}
            description="Only you will see this view."
            select={() => this.setState({isShared: false})}
            checked={!isShared}
          />
          <ViewTypeOption
            label={<React.Fragment>Save under <em>Shared views</em></React.Fragment>}
            description="You can select which roles should see this view in the next step."
            select={() => this.setState({isShared: true})}
            checked={isShared}
          />
        </ul>
        }
      </div>
      <div className="modal-dialog__controls">
        <button
          className="btn-primary-action"
          onClick={confirm}
          disabled={trimmed.length < minLength}
        >
          {isShared && allowRoleAssignment ? 'Proceed and select roles' : 'Save view'}
        </button>
        <button className="btn-secondary-action" onClick={cancel}>Cancel</button>
      </div>
    </div>;
  }
}
