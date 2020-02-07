import React from 'react';
import PropTypes from 'prop-types';
import {
  TeamMembership as TeamMembershipPropType,
  User as UserPropType
} from 'app/OrganizationSettings/PropTypes';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Heading,
  Paragraph,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { css } from 'emotion';

import { getFullNameOrEmail } from 'app/OrganizationSettings/Users/UserUtils';
import moment from 'moment';

const styles = {
  table: css({
    tableLayout: 'fixed'
  }),
  ellipsis: css({
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  }),
  emptyState: css({
    marginTop: tokens.spacing4Xl
  })
};

export default function UserTeamMemberships({ memberships = [], loading, user }) {
  if (loading) return <Skeleton />;
  if (!loading && memberships.length === 0) return <EmptyState user={user} />;
  return (
    <Table testId="user-team-list" className={styles.table}>
      <TableHead>
        <TableRow>
          <TableCell width="33%">Name</TableCell>
          <TableCell width="33%">Description</TableCell>
          <TableCell>Members</TableCell>
          <TableCell>Added at</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {memberships.map(membership => (
          <TableRow key={membership.sys.id} testId="user-team-list.item">
            <TableCell>
              <div className={styles.ellipsis}>{membership.sys.team.name}</div>
            </TableCell>
            <TableCell>
              <div className={styles.ellipsis}>{membership.sys.team.description}</div>
            </TableCell>
            <TableCell>{membership.sys.team.memberCount}</TableCell>
            <TableCell>{moment(membership.sys.createdAt).format('MMMM DD, YYYY')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

UserTeamMemberships.propTypes = {
  memberships: PropTypes.arrayOf(TeamMembershipPropType).isRequired,
  user: UserPropType.isRequired,
  loading: PropTypes.bool
};

function Skeleton() {
  return (
    <SkeletonContainer
      data-test-id="content-loader"
      ariaLabel="Loading the list of teams"
      svgWidth="100%">
      <SkeletonBodyText numberOfLines={2} />
      <SkeletonBodyText numberOfLines={2} offsetTop={75} />
      <SkeletonBodyText numberOfLines={2} offsetTop={150} />
      <SkeletonBodyText numberOfLines={2} offsetTop={225} />
      <SkeletonBodyText numberOfLines={2} offsetTop={300} />
      <SkeletonBodyText numberOfLines={2} offsetTop={375} />
    </SkeletonContainer>
  );
}

function EmptyState({ user }) {
  return (
    <EmptyStateContainer className={styles.emptyState}>
      <Heading>{`${getFullNameOrEmail(user)} is not a member of any team`}</Heading>
      <Paragraph>Add them to their first team.</Paragraph>
    </EmptyStateContainer>
  );
}

EmptyState.propTypes = {
  user: UserPropType.isRequired
};
