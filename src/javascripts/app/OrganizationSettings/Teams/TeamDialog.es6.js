import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isEmpty, get, some } from 'lodash';
import { Modal, TextField, Button } from '@contentful/forma-36-react-components';
import { getTeams } from 'redux/selectors/teams.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';

class TeamDialog extends React.Component {
  static propTypes = {
    initialTeam: TeamPropType,
    isShown: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,

    allTeams: PropTypes.objectOf(TeamPropType),
    onCreateConfirm: PropTypes.func,
    onEditConfirm: PropTypes.func
  };

  state = {};

  componentDidUpdate(prevProps) {
    if (!prevProps.isShown && this.props.isShown) {
      const { initialTeam } = this.props;
      this.setState({
        validationMessage: null,
        name: get(initialTeam, 'name', ''),
        description: get(initialTeam, 'description', ''),
        isEditing: Boolean(initialTeam)
      });
    }
  }

  onConfirm = e => {
    e.preventDefault();
    const { onEditConfirm, onCreateConfirm, onClose, initialTeam } = this.props;
    const { isEditing } = this.state;
    // Don't trim the content of inputs, it leads to irritating behaviour
    // specifically, if the user deletes characters and it's spaces the spaces will disappear
    const name = this.state.name.trim();
    const description = this.state.description.trim();

    const validationMessage = this.getValidationMessage();
    if (validationMessage) {
      this.setState({ validationMessage });
      return;
    }

    if (isEditing) {
      onEditConfirm(initialTeam.sys.id, { name, description });
    } else {
      onCreateConfirm({ name, description });
    }

    onClose();
  };

  getValidationMessage() {
    const { name } = this.state;
    const { allTeams, initialTeam } = this.props;

    if (isEmpty(name)) {
      return 'Please insert a name';
    }
    if (
      some(
        allTeams,
        otherTeam => otherTeam.name === name.trim() && initialTeam.sys.id !== otherTeam.sys.id
      )
    ) {
      return 'This name is already in use';
    }
    return null;
  }

  handleChange = field => evt => {
    this.setState({ [field]: evt.target.value, validationMessage: '' });
  };

  render() {
    const { onClose, isShown } = this.props;
    const { name, description, validationMessage, isEditing } = this.state;

    return (
      <Modal isShown={isShown} onClose={onClose}>
        {() => (
          <form
            noValidate
            onSubmit={this.onConfirm}
            style={{ display: 'flex', flexDirection: 'column' }}>
            <Modal.Header title={isEditing ? 'Edit team' : 'New team'} onClose={onClose} />
            <Modal.Content>
              <p>Teams make it easy to group people together.</p>
              <TextField
                required
                name="teamName"
                id="team_name"
                labelText="Team name"
                value={name}
                countCharacters
                textInputProps={{
                  placeholder: 'The Mighty Ducks',
                  maxLength: 120,
                  autoFocus: true
                }}
                extraClassNames={'vertical-form-field-rythm-dense'}
                validationMessage={validationMessage}
                onChange={this.handleChange('name')}
              />
              <TextField
                name="teamDescription"
                id="team_description"
                textarea
                labelText="Team description"
                value={description}
                countCharacters
                textInputProps={{
                  placeholder: `The Mighty Ducks is a series of three live-action films that revolve around a Twin Cities ice hockey team, composed of young players that stick together throughout various challenges.`,
                  maxLength: 800,
                  rows: 3
                }}
                extraClassNames={'vertical-form-field-rythm-dense'}
                onChange={this.handleChange('description')}
              />
            </Modal.Content>
            <Modal.Controls>
              <Button buttonType="primary" type="submit" testId="save-team-button">
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
        )}
      </Modal>
    );
  }
}

export default connect(
  state => ({
    allTeams: getTeams(state)
  }),
  dispatch => ({
    onCreateConfirm: team => dispatch({ type: 'CREATE_NEW_TEAM', payload: { team } }),
    onEditConfirm: (id, changeSet) =>
      dispatch({ type: 'EDIT_TEAM_CONFIRMED', payload: { id, changeSet } })
  })
)(TeamDialog);
