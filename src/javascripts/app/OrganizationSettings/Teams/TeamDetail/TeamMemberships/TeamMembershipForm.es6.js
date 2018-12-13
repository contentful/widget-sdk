import React from 'react';
import PropTypes from 'prop-types';
import { TableCell, TableRow, Button, Select, Option } from '@contentful/forma-36-react-components';
import {
  TeamMembership as TeamMembershipPropyType,
  OrganizationMembership as OrganizationMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';

export default class TeamMembershipForm extends React.Component {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
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
    this.setState({ loading: true });
    await this.props.onMembershipCreate({ orgMembershipId: this.state.selectedOrgMembershipId });
    this.setState({ loading: false });
  };

  render() {
    const { loading, selectedOrgMembershipId } = this.state;
    return (
      <TableRow extraClassNames="space-membership-editor">
        <TableCell colSpan="2">
          <Select onChange={this.setOrgMembership}>
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
          <Button size="small" buttonType="naked" onClick={this.props.onCancel}>
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}
