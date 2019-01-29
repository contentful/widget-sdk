import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get, orderBy, filter, flow } from 'lodash/fp';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';
import { getCurrentTeamMembershipList } from 'redux/selectors/teamMemberships.es6';
import { TableCell, TableRow, Button, Select, Option } from '@contentful/forma-36-react-components';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes.es6';

class TeamMembershipForm extends React.Component {
  static propTypes = {
    orgMemberships: PropTypes.arrayOf(OrganizationMembershipPropType),
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
  };

  state = {
    selectedOrgMembershipId: null
  };

  setOrgMembership = evt => {
    this.setState({ selectedOrgMembershipId: evt.target.value });
  };

  render() {
    const { orgMemberships, onSubmit, onClose } = this.props;
    const { selectedOrgMembershipId } = this.state;
    return (
      <TableRow extraClassNames="space-membership-editor">
        <TableCell colSpan="2">
          <Select data-test-id="user-select" onChange={this.setOrgMembership} defaultValue="">
            <Option value="" disabled>
              Please select a user
            </Option>
            {orgMemberships.map(({ sys: { user, id } }) => (
              <Option data-test-id="user-select-option" key={id} value={id}>
                {`${user.firstName} ${user.lastName} <${user.email}>`}
              </Option>
            ))}
          </Select>
        </TableCell>
        <TableCell align="right" valign="middle">
          <Button
            testId="add-member-button"
            size="small"
            buttonType="primary"
            onClick={() => onSubmit(selectedOrgMembershipId)}
            disabled={!selectedOrgMembershipId}
            style={{ marginRight: '10px' }}>
            Add to team
          </Button>
          <Button testId="cancel-button" size="small" buttonType="naked" onClick={onClose}>
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}

function getAvailableOrgMemberships(state) {
  const teamMemberships = getCurrentTeamMembershipList(state);
  const unavailableOrgMemberships = teamMemberships.map(get('sys.organizationMembership.sys.id'));
  return flow(
    getOrgMemberships,
    Object.values,
    filter(({ sys: { id } }) => !unavailableOrgMemberships.includes(id)),
    orderBy(['sys.user.firstName', 'sys.user.lastName'], ['asc', 'asc'])
  )(state);
}

export default connect(
  state => ({
    orgMemberships: getAvailableOrgMemberships(state)
  }),
  (dispatch, { onClose }) => ({
    onSubmit: orgMembership => {
      dispatch({ type: 'SUBMIT_NEW_TEAM_MEMBERSHIP', payload: { orgMembership } });
      onClose();
    }
  })
)(TeamMembershipForm);
