import React, { useCallback, useMemo } from 'react';
import {
  EntityList,
  EntityListItem,
  Modal,
  Paragraph,
  Spinner,
  Subheading,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useSpaceContext } from 'features/content-tags/core/hooks';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo';
import { create as createMembershipRepo } from 'access_control/SpaceMembershipRepository';
import RoleRepository from 'access_control/RoleRepository';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository';
import resolveLinks from 'data/LinkResolver';
import { useAsync } from 'core/hooks';
import PropTypes from 'prop-types';

const styles = {
  subheading: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingS,
  }),
  list: css({
    borderBottom: '1px solid rgb(211, 220, 224)',
    '& li': {
      borderBottom: '0 !important',
    },
    '& article': {
      borderBottom: '0 !important',
    },
  }),
  container: css({
    border: '1px solid rgb(211, 220, 224)',
    padding: tokens.spacing3Xl,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

const useUserList = () => {
  const { endpoint, space } = useSpaceContext();

  const fetchAll = useCallback(async () => {
    const [members, spaceMemberships, roles, spaceUsers] = await Promise.all([
      createSpaceMembersRepo(endpoint).getAll(),
      createMembershipRepo(endpoint).getAll(),
      RoleRepository.getInstance(space).getAll(),
      getAllUsers(endpoint),
    ]);

    const resolvedMembers = resolveLinks({
      paths: ['roles', 'sys.relatedMemberships', 'sys.user'],
      includes: { Role: roles, SpaceMembership: spaceMemberships, User: spaceUsers },
      items: members,
    });

    return { resolvedMembers, roles, spaceUsers };
  }, [endpoint, space]);

  return useAsync(fetchAll);
};

function AdminsOnlyModal({ isShown, onClose }) {
  const { isLoading, data } = useUserList();

  const users = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.resolvedMembers
      .filter((rMember) => rMember.admin)
      .map((rMember) => rMember.sys.user);
  }, [data]);

  const renderUser = (user) => {
    return (
      <EntityListItem
        key={user.sys.id}
        title={`${user.firstName} ${user.lastName}`}
        thumbnailUrl={user.avatarUrl}
        thumbnailAltText={`${user.firstName} ${user.lastName}`}
        description={user.email}
      />
    );
  };

  return (
    <Modal title={'Manage Tags'} isShown={isShown} onClose={onClose} allowHeightOverflow={false}>
      <Paragraph>
        You don’t have permission to manage tags. Ask a space admin to give you permission.
      </Paragraph>
      <Subheading className={styles.subheading}>Space Admins</Subheading>
      {isLoading ? (
        <div className={styles.container}>
          <Spinner size={'large'} />
        </div>
      ) : (
        <EntityList className={styles.list}>{users.map(renderUser)}</EntityList>
      )}
    </Modal>
  );
}

AdminsOnlyModal.defaultProps = {
  isShown: false,
};

AdminsOnlyModal.propTypes = {
  isShown: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export { AdminsOnlyModal };
