import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { orderBy } from 'lodash';
import {
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableBody,
  TextLink
} from '@contentful/forma-36-react-components';
import { href } from 'states/Navigator.es6';

import Workbench from 'app/common/Workbench.es6';

export default class InvitationsList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    membershipsCount: PropTypes.number.isRequired,
    invitations: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired,
          createdAt: PropTypes.string.isRequired
        }).isRequired,
        email: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired
      })
    ).isRequired,
    pendingMemberships: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired,
          createdAt: PropTypes.string.isRequired,
          user: PropTypes.shape({
            email: PropTypes.string.isRequired
          }).isRequired
        }).isRequired,
        role: PropTypes.string.isRequired
      })
    ).isRequired
  };

  getLinkToUsersList() {
    return href({
      path: ['account', 'organizations', 'users'],
      params: { orgId: this.props.orgId }
    });
  }

  render() {
    const { invitations, pendingMemberships, membershipsCount } = this.props;
    const unifiedInvitationsAndMemberships = invitations
      .map(({ email, role, sys: { id, createdAt } }) => ({
        id,
        createdAt: moment(createdAt),
        email,
        role
      }))
      .concat(
        pendingMemberships.map(({ role, sys: { id, createdAt, user: { email } } }) => ({
          id,
          createdAt: moment(createdAt),
          email,
          role
        }))
      );
    const sortedList = orderBy(unifiedInvitationsAndMemberships, ['createdAt'], ['desc']);

    return (
      <Workbench className="invitation-list">
        <Workbench.Header>
          <Workbench.Title>{`Invited users (${invitations.length})`}</Workbench.Title>
          <TextLink href={this.getLinkToUsersList()}>View all users ({membershipsCount})</TextLink>
        </Workbench.Header>
        <Workbench.Content>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">User</TableCell>
                <TableCell width="200">Organization role</TableCell>
                <TableCell colSpan="2">Invited at (most recent)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedList.map(({ id, createdAt, email, role }) => (
                <TableRow key={id} extraClassNames="invitation-list__row">
                  <TableCell>{email}</TableCell>
                  <TableCell>{role}</TableCell>
                  <TableCell>{createdAt.format('MMM Do YYYY, hh:mm a')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Workbench.Content>
      </Workbench>
    );
  }
}
