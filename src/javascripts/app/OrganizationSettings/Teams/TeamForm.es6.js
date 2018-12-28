import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty, trim } from 'lodash';
import { Modal, TextField, Button } from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';

import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';

export default class TeamForm extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialTeam: TeamPropType,
    onConfirm: PropTypes.func
  };

  static defaultProps = {
    initialTeam: { name: '', description: '' }
  };

  isEditing = Boolean(this.props.initialTeam);
  service = createTeamService(this.props.orgId);

  state = this.props.initialTeam;

  onConfirm = async () => {
    const { onConfirm, onClose } = this.props;
    const { name, description } = this.state;

    if (!this.isValid()) {
      this.setState({ validationMessage: 'Please insert a name' });
    } else {
      onConfirm({ name, description });
      onClose();
    }
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
        <Modal.Header title={this.isEditing ? 'Edit team' : 'New team'} onClose={onClose} />
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
