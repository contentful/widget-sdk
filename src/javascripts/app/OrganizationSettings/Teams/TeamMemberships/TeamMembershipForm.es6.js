import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get, orderBy, filter, flow } from 'lodash/fp';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';
import { getCurrentTeamMembershipList } from 'redux/selectors/teamMemberships.es6';
import { TableCell, TableRow, Button, Select, Option } from '@contentful/forma-36-react-components';
import {
  TeamMembership as TeamMembershipPropyType,
  OrganizationMembership as OrganizationMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';

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

class TeamMembershipForm extends React.Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    initialMembership: TeamMembershipPropyType,

    orgMemberships: PropTypes.arrayOf(OrganizationMembershipPropType),
    onMembershipCreate: PropTypes.func
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
    const { orgMemberships } = this.props;
    const { loading, selectedOrgMembershipId } = this.state;
    return (
      <TableRow extraClassNames="space-membership-editor">
        <TableCell colSpan="2">
          <Select onChange={this.setOrgMembership} defaultValue="">
            <Option value="" disabled>
              Please select a user
            </Option>
            {orgMemberships.map(orgMembership => {
              const user = orgMembership.sys.user;
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

export default connect(
  state => ({
    orgMemberships: getAvailableOrgMemberships(state)
  }),
  dispatch => ({
    onMembershipCreate: orgMembership =>
      dispatch({ type: 'SUBMIT_NEW_TEAM_MEMBERSHIP', payload: { orgMembership } })
  })
)(TeamMembershipForm);
