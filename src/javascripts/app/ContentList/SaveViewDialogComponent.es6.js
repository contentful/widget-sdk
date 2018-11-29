import React from 'react';
import PropTypes from 'prop-types';
import { TextField, RadioButtonField } from '@contentful/forma-36-react-components';
import keycodes from 'utils/keycodes.es6';

const MIN_LENGTH = 1;
const MAX_LENGTH = 32;

export default class SaveViewDialog extends React.Component {
  static propTypes = {
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    allowViewTypeSelection: PropTypes.bool.isRequired,
    allowRoleAssignment: PropTypes.bool.isRequired
  };

  state = { value: '', viewType: 'isPrivate' };

  render() {
    const { cancel, allowViewTypeSelection, allowRoleAssignment } = this.props;
    const { value, viewType } = this.state;

    const trimmed = value.trim();
    const isValid = !(trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH);
    const confirm = () =>
      isValid && this.props.confirm({ title: trimmed, isShared: viewType === 'isShared' });
    const onKeyDown = e => e.keyCode === keycodes.ENTER && confirm();

    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>Save as view</h1>
          <button className="modal-dialog__close" onClick={cancel} />
        </header>
        <div className="modal-dialog__content">
          <p className="modal-dialog__richtext" style={{ marginBottom: '25px' }}>
            A view displays a list of entries you searched for. By saving the current view, you will
            be able to re-use it later.
          </p>
          <TextField
            id="name"
            name="name"
            labelText="Name of the view"
            required
            value={value}
            onChange={e => this.setState({ value: e.target.value })}
            onKeyDown={onKeyDown}
            maxLength={String(MAX_LENGTH)}
            style={{ marginTop: '5px' }}
          />
          {allowViewTypeSelection && (
            <ul style={{ marginTop: '20px' }}>
              <li>
                <RadioButtonField
                  id="option-private"
                  labelText="Save under my views"
                  helpText="Only you will see this view."
                  value="isPrivate"
                  onChange={e => this.setState({ viewType: e.target.value })}
                  checked={viewType === 'isPrivate'}
                  labelIsLight
                />
              </li>
              <li>
                <RadioButtonField
                  labelText="Save under shared views"
                  id="option-shared"
                  value="isShared"
                  helpText="You can select which roles should see this view in the next step."
                  onChange={e => this.setState({ viewType: e.target.value })}
                  checked={viewType === 'isShared'}
                  labelIsLight
                />
              </li>
            </ul>
          )}
        </div>
        <div className="modal-dialog__controls">
          <button
            className="btn-primary-action"
            onClick={confirm}
            disabled={trimmed.length < MIN_LENGTH}>
            {viewType === 'isShared' && allowRoleAssignment
              ? 'Proceed and select roles'
              : 'Save view'}
          </button>
          <button className="btn-secondary-action" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
}
