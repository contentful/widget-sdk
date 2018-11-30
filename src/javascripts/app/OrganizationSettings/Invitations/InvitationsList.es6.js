import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { orderBy } from 'lodash';
import {
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableBody
} from '@contentful/forma-36-react-components';

import Workbench from '../../common/Workbench.es6';

export default class InvitationsList extends React.Component {
  static propTypes = {
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

  render() {
    const { invitations, pendingMemberships } = this.props;
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
          <Workbench.Title>{`Invitations (${invitations.length})`}</Workbench.Title>
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
                <TableRow
                  key={id}
                  extraClassNames="invitation-list__row"
                  onClick={() => alert('invitation details')}>
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
