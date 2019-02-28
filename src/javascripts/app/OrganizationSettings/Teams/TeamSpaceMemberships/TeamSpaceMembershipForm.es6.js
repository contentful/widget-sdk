import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { flow, map } from 'lodash/fp';
import { get } from 'lodash';
import getCurrentOrgSpaces from 'redux/selectors/getCurrentOrgSpaces.es6';
import { getCurrentTeamSpaceMembershipList } from 'redux/selectors/teamSpaceMemberships.es6';
import getRolesBySpace from 'redux/selectors/getRolesBySpace.es6';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor.es6';
import { TableCell, TableRow, Button, Select, Option } from '@contentful/forma-36-react-components';
import { getMembershipRoles } from 'access_control/SpaceMembershipRepository.es6';
import {
  Space as SpacePropType,
  SpaceRole as SpaceRolePropType,
  TeamSpaceMembership as TeamSpaceMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';

class TeamMembershipForm extends React.Component {
  static propTypes = {
    initialMembership: TeamSpaceMembershipPropType,
    onClose: PropTypes.func.isRequired,

    availableSpaces: PropTypes.arrayOf(SpacePropType),
    roles: PropTypes.objectOf(PropTypes.arrayOf(SpaceRolePropType)),
    onSubmit: PropTypes.func.isRequired
  };

  state = {
    selectedSpaceId: get(this.props.initialMembership, 'sys.space.sys.id', null),
    selectedRoles: this.props.initialMembership
      ? flow(
          getMembershipRoles,
          map('sys.id')
        )(this.props.initialMembership)
      : []
  };

  setSpace = evt => {
    this.setState({ selectedSpaceId: evt.target.value, selectedRoles: [] });
  };

  setRoles = selectedRoles => {
    this.setState({ selectedRoles });
  };

  render() {
    const { availableSpaces, roles, onSubmit, onClose } = this.props;
    const { selectedSpaceId, selectedRoles } = this.state;
    return (
      <TableRow extraClassNames="space-membership-editor">
        <TableCell colSpan="2">
          <Select data-test-id="space-select" onChange={this.setSpace} defaultValue="">
            <Option value="" disabled>
              Please select a space
            </Option>
            {availableSpaces.map(({ name, sys: { id } }) => (
              <Option data-test-id="space-select-option" key={id} value={id}>
                {name}
              </Option>
            ))}
          </Select>
        </TableCell>
        <TableCell>
          <SpaceRoleEditor
            isDisabled={!selectedSpaceId}
            options={roles[selectedSpaceId]}
            value={selectedRoles}
            onChange={this.setRoles}
          />
        </TableCell>
        <TableCell colSpan="2" align="right" valign="middle">
          <Button
            testId="add-member-button"
            size="small"
            buttonType="primary"
            onClick={() => onSubmit(selectedSpaceId, selectedRoles)}
            disabled={!selectedSpaceId || selectedRoles.length === 0}
            style={{ marginRight: '10px' }}>
            Add to space
          </Button>
          <Button testId="cancel-button" size="small" buttonType="naked" onClick={onClose}>
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}

function getAvailableSpaces(state) {
  const teamSpaceMemberships = getCurrentTeamSpaceMembershipList(state);
  const unavailableSpaces = teamSpaceMemberships.map(membership =>
    get(membership, 'sys.space.sys.id')
  );
  const spaces = Object.values(getCurrentOrgSpaces(state));

  return spaces
    .filter(space => !unavailableSpaces.includes(space.sys.id))
    .sort((curr, prev) => curr.name.localeCompare(prev.name));
}

export default connect(
  state => ({
    availableSpaces: getAvailableSpaces(state),
    roles: getRolesBySpace(state)
  }),
  (dispatch, { onClose }) => ({
    onSubmit: (spaceId, roles) => {
      dispatch({ type: 'SUBMIT_NEW_TEAM_SPACE_MEMBERSHIP', payload: { spaceId, roles } });
      onClose();
    },
    onEdit: updatedMembership => {
      dispatch({ type: 'EDIT_TEAM_SPACE_MEMBERSHIP', payload: { updatedMembership } });
      onClose();
    }
  })
)(TeamMembershipForm);
