import React from 'react';
import PropTypes from 'prop-types';

import {
  SpaceMembership as SpaceMembershipPropType,
  User as UserPropType
} from 'app/OrganizationSettings/PropTypes';
import { joinWithAnd } from 'utils/StringUtils';
import { getMembershipRoles } from 'access_control/utils';
import { getUserName, getFullNameOrEmail } from 'app/OrganizationSettings/Users/UserUtils';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';

import moment from 'moment';

import {
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableRow,
  CardActions,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

export default function UserSpaceList({
  user,
  memberships = [],
  loading = true,
  onSpaceMembershipRemove,
  onSpaceMembershipEdit
}) {
  if (loading) return <Skeleton />;
  if (!loading && memberships.length === 0) return <EmptyState user={user} />;
  return (
    <Table testId="user-memberships-table">
      <TableHead>
        <TableRow>
          <TableCell>Space</TableCell>
          <TableCell>Space roles</TableCell>
          <TableCell>Added by</TableCell>
          <TableCell>Added at</TableCell>
          <TableCell width="200px" />
        </TableRow>
      </TableHead>
      <TableBody>
        {memberships.map(membership => (
          <UserSpaceRow
            key={membership.sys.id}
            membership={membership}
            onRemove={() => onSpaceMembershipRemove(membership)}
            onEdit={() => onSpaceMembershipEdit(membership)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

UserSpaceList.propTypes = {
  user: UserPropType.isRequired,
  memberships: PropTypes.arrayOf(SpaceMembershipPropType),
  onSpaceMembershipRemove: PropTypes.func.isRequired,
  onSpaceMembershipEdit: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

function UserSpaceRow({ membership, onRemove, onEdit }) {
  return (
    <TableRow key={membership.sys.id}>
      <TableCell>{membership.sys.space.name}</TableCell>
      <TableCell>{joinWithAnd(getMembershipRoles(membership).map(role => role.name))}</TableCell>
      <TableCell>{getUserName(membership.sys.createdBy)}</TableCell>
      <TableCell>{moment(membership.sys.createdAt).format('MMMM DD, YYYY')}</TableCell>
      <TableCell align="right">
        <CardActions
          iconButtonProps={{ buttonType: 'primary' }}
          data-test-id="user-details.space.menu">
          <DropdownList>
            <DropdownListItem onClick={onEdit} testId="user-details.space.menu.edit">
              Change space role
            </DropdownListItem>
            <DropdownListItem onClick={onRemove} testId="user-details.space.menu.remove">
              Remove memberships
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
}

UserSpaceRow.propTypes = {
  membership: SpaceMembershipPropType.isRequired,
  onRemove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

function Skeleton() {
  return (
    <SkeletonContainer
      data-test-id="content-loader"
      ariaLabel="Loading the list of spaces"
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

const styles = {
  emptyState: css({
    marginTop: tokens.spacing4Xl
  })
};

function EmptyState({ user }) {
  return (
    <EmptyStateContainer className={styles.emptyState}>
      <Heading>{`${getFullNameOrEmail(user)} is not a member of any space`}</Heading>
      <Paragraph>Add them to a space to give them access.</Paragraph>
    </EmptyStateContainer>
  );
}

EmptyState.propTypes = {
  user: UserPropType.isRequired
};
