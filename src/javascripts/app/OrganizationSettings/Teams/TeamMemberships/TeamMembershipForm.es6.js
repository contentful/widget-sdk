import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';
import getCurrentTeamMemberships from 'redux/selectors/getCurrentTeamMemberships.es6';
import { TableCell, TableRow, Button, Select, Option } from '@contentful/forma-36-react-components';
import {
  TeamMembership as TeamMembershipPropyType,
  OrganizationMembership as OrganizationMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';

function getAvailableOrgMemberships(state) {
  const teamMemberships = getCurrentTeamMemberships(state);
  const unavailableOrgMemberships = teamMemberships.map(
    membership => membership.sys.organizationMembership.sys.id
  );
  const orgMemberships = getOrgMemberships(state);
  return orgMemberships.filter(
    membership => !unavailableOrgMemberships.includes(membership.sys.id)
  );
}

export default connect(
  state => ({
    orgMemberships: getAvailableOrgMemberships(state)
  }),
  dispatch => ({
    onMembershipCreate: orgMembership =>
      dispatch({ type: 'SUBMIT_NEW_TEAM_MEMBERSHIP', payload: { orgMembership } })
  })
)(
  class TeamMembershipForm extends React.Component {
    static propTypes = {
      close: PropTypes.func.isRequired,
      orgMemberships: PropTypes.arrayOf(OrganizationMembershipPropType),
      onMembershipCreate: PropTypes.func,
      onMembershipChange: PropTypes.func,
      initialMembership: TeamMembershipPropyType
    };

    state = {
      selectedOrgMembershipId: null,
      isAdmin: false,
      loading: false
    };

    setOrgMembership = evt => {
      this.setState({ selectedOrgMembershipId: evt.target.value });
    };

    submit = async () => {
      this.props.onMembershipCreate(this.state.selectedOrgMembershipId);
      this.props.close();
    };

    render() {
      const { loading, selectedOrgMembershipId } = this.state;
      return (
        <TableRow extraClassNames="space-membership-editor">
          <TableCell colSpan="2">
            <Select onChange={this.setOrgMembership} defaultValue="">
              <Option value="" disabled>
                Please select a user
              </Option>
              {this.props.orgMemberships.map(orgMembership => {
                const user = orgMembership.sys.user;
                // TODO: handle pending invitations
                return (
                  <Option key={orgMembership.sys.id} value={orgMembership.sys.id}>
                    {`
                    ${user.firstName} ${user.lastName}
                    <${user.email}>
                  `}
                  </Option>
                );
              })}
            </Select>
          </TableCell>
          <TableCell align="right" valign="middle">
            <Button
              size="small"
              buttonType="primary"
              onClick={this.submit}
              disabled={!selectedOrgMembershipId}
              loading={loading}
              style={{ marginRight: '10px' }}>
              Add to team
            </Button>
            <Button size="small" buttonType="naked" onClick={this.props.close}>
              Cancel
            </Button>
          </TableCell>
        </TableRow>
      );
    }
  }
);
