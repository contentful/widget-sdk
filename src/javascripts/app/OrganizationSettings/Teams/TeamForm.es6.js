import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty, trim } from 'lodash';
import { Modal, TextField, Button } from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';

export default class TeamForm extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    initialTeam: TeamPropType,
    onCreateConfirm: PropTypes.func,
    onEditConfirm: PropTypes.func
  };

  isEditing = Boolean(this.props.initialTeam);

  state = {
    validationMessage: null,
    name: this.isEditing ? this.props.initialTeam.name : '',
    description: this.isEditing ? this.props.initialTeam.description : ''
  };

  onConfirm = e => {
    e.preventDefault();
    const { onEditConfirm, onCreateConfirm, onClose, initialTeam } = this.props;
    const { name, description } = this.state;

    if (!this.isValid()) {
      this.setState({ validationMessage: 'Please insert a name' });
      return;
    }

    if (this.isEditing) {
      onEditConfirm(initialTeam.sys.id, { name, description });
    } else {
      onCreateConfirm({ name, description });
    }

    onClose();
  };

  isValid() {
    return !isEmpty(this.state.name);
  }

  handleChange = field => evt => {
    this.setState({ [field]: trim(evt.target.value), validationMessage: '' });
  };

  render() {
    const { onClose } = this.props;
    const { name, description, validationMessage, busy } = this.state;

    return (
      <form
        noValidate
        onSubmit={this.onConfirm}
        style={{ display: 'flex', flexDirection: 'column' }}>
        <Modal.Header title={this.isEditing ? 'Edit team' : 'New team'} onClose={onClose} />
        <Modal.Content>
          <p>Teams make it easy to group people together.</p>
          <TextField
            required
            name="teamName"
            id="team_name"
            labelText="Team name"
            value={name}
            countCharacters
            textInputProps={{ placeholder: 'Team Rocket', maxLength: 120, autoFocus: true }}
            extraClassNames={'vertical-form-field-rythm-dense'}
            validationMessage={validationMessage}
            onChange={this.handleChange('name')}
          />
          <TextField
            name="teamDescription"
            id="team_description"
            labelText="Team description"
            value={description}
            countCharacters
            textInputProps={{ placeholder: 'Team Rocket', maxLength: 120 }}
            extraClassNames={'vertical-form-field-rythm-dense'}
            onChange={this.handleChange('description')}
          />
        </Modal.Content>
        <Modal.Controls>
          <Button loading={busy} buttonType="primary" type="submit" testId="save-team-button">
            Save
          </Button>
          <Button
            type="button"
            onClick={onClose}
            buttonType="muted"
            testId="close-team-dialog-button">
            Cancel
          </Button>
        </Modal.Controls>
      </form>
    );
  }
}
