import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty, trim } from 'lodash';
import { Modal, TextField, Button, Notification } from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';

import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';

export default class TeamForm extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialTeam: TeamPropType,
    onTeamCreated: PropTypes.func,
    onConfirm: PropTypes.func
  };

  isEditing = Boolean(this.props.initialTeam);
  service = createTeamService(this.props.orgId);

  state = {
    name: this.isEditing ? this.props.initialTeam.name : '',
    description: this.isEditing ? this.props.initialTeam.description : ''
  };

  onConfirm = async () => {
    const { name, description } = this.state;

    if (!this.isValid()) {
      this.setState({ validationMessage: 'Please insert a name' });
    } else {
      this.setState({
        busy: true,
        validationMessage: ''
      });

      try {
        if (this.isEditing) {
          await this.service.update({ ...this.props.initialTeam, name, description });
          Notification.success(`Team updated successfully`);
        } else {
          const newTeam = await this.service.create({ name, description });
          Notification.success(`Team ${name} created successfully`);
          this.props.onTeamCreated(newTeam);
          this.props.onClose();
        }
      } catch (e) {
        Notification.error(e.message);
      }

      this.setState({
        busy: false
      });
    }
  };

  onClose = () => {
    this.props.onClose();
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
      <React.Fragment>
        <Modal.Header title={this.isEditing ? 'Edit team' : 'New team'} onClose={this.onClose} />
        <Modal.Content>
          <p>Teams make it easy to group people together.</p>
          <TextField
            required
            name="teamName"
            id="team_name"
            labelText="Team name"
            value={name}
            textInputProps={{ placeholder: 'Team Rocket' }}
            extraClassNames={'vertical-form-field-rythm-dense'}
            validationMessage={validationMessage}
            onChange={this.handleChange('name')}
          />
          <TextField
            name="teamDescription"
            id="team_description"
            labelText="Team description"
            value={description}
            textInputProps={{ placeholder: 'Team Rocket' }}
            extraClassNames={'vertical-form-field-rythm-dense'}
            onChange={this.handleChange('description')}
          />
        </Modal.Content>
        <Modal.Controls>
          <Button
            onClick={this.onConfirm}
            loading={busy}
            buttonType="primary"
            testId="save-team-button">
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
      </React.Fragment>
    );
  }
}
