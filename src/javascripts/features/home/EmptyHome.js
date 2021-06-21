import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Paragraph,
  Typography,
  Button,
  Spinner,
} from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import * as CreateSpace from 'services/CreateSpace';
import Illustration from 'svg/illustrations/readonly-space-home-ill.svg';
import EmptyStateAdminIllustration from 'svg/folder-illustration.svg';
import { useAsync } from 'core/hooks';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSpaces, getUserSync } from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { go } from 'states/Navigator';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { router } from 'core/react-routing';

const store = getBrowserStorage();

function getLastUsedSpace(spaces) {
  const spaceId = store.get('lastUsedSpace');
  return spaceId && spaces.find((space) => space.sys.id === spaceId);
}

function getOrgSpace(spaces, orgId = store.get('lastUsedOrg')) {
  return orgId && spaces.find((space) => space.organization.sys.id === orgId);
}

function getOrg(user, orgId) {
  const lastUsedOrg = store.get('lastUsedOrg');

  if (!user.organizationMemberships) {
    return null;
  }

  if (orgId) {
    return user.organizationMemberships.find(
      (membership) => membership.organization.sys.id === orgId
    )?.organization;
  }

  if (user.organizationMemberships.length === 1) {
    return user.organizationMemberships[0].organization;
  }

  return user.organizationMemberships.find(
    (membership) => membership.organization.sys.id === lastUsedOrg
  )?.organization;
}

/**
 * Navigate the user to the most appropriate place, or show them an appropriate home page.
 *
 * If the organization ID is not supplied:
 *
 * Get the last used org, and get the first space that belongs to that org, and redirect the user
 * to that space. If no such space exists, check if the user has any org memberships. If the user
 * has no org memberships, direct them to their account settings page. Otherwise, show them the
 * empty home page.
 *
 * If the organization ID is supplied:
 *
 * Same as above, except instead of using the last used org, use the given org ID, and instead of
 * checking if any org memberships exist, check if a membership exists for that specific org.
 * @param  {String} orgId? Optional organization ID, used to direct the user to a specific org
 * @return {Object}
 */
const initialLoad = (orgId) => async () => {
  const space = await getSpaces().then((spaces) => {
    if (spaces.length === 0) {
      return null;
    }

    if (orgId) {
      return getOrgSpace(spaces, orgId);
    }

    return getLastUsedSpace(spaces) || getOrgSpace(spaces) || spaces[0];
  });

  if (space) {
    return go({
      path: ['spaces', 'detail'],
      params: { spaceId: space.sys.id },
      options: { location: 'replace' },
    });
  }

  const user = getUserSync();
  const org = getOrg(user, orgId);

  if (!org) {
    return router.navigate({ path: 'account.profile.user' }, { location: 'replace' });
  }

  return {
    organization: org,
    userIsOrgAdminOrOwner: isOwnerOrAdmin(org),
  };
};

export const EmptyHome = ({ orgId }) => {
  const { isLoading, data, error } = useAsync(useCallback(initialLoad(orgId), []));

  useEffect(() => {
    if (error) {
      router.navigate({ path: 'error' });
    }
  }, [error]);

  return (
    <div className="home" data-test-id="empty-space-home.container">
      <DocumentTitle title="Space home" />
      {(isLoading || !data) && (
        <EmptyStateContainer>
          <Spinner size="large" />
        </EmptyStateContainer>
      )}
      {!isLoading && data && data.userIsOrgAdminOrOwner && (
        <EmptyStateContainer data-test-id="cf-ui-empty-space-admin">
          <EmptyStateAdminIllustration className={defaultSVGStyle} />
          <Heading>Starting something new?</Heading>
          <Paragraph>
            A space is an area to manage and store content for a specific project.
          </Paragraph>
          <Button
            testId="cf-ui-empty-space-admin.create-space"
            onClick={() => CreateSpace.beginSpaceCreation(data.organization.sys.id)}>
            Add a space
          </Button>
        </EmptyStateContainer>
      )}
      {!isLoading && data && !data.userIsOrgAdminOrOwner && (
        <EmptyStateContainer data-test-id="cf-ui-empty-space">
          <Illustration className={defaultSVGStyle} />
          <Typography>
            <Heading>Waiting for space access?</Heading>
            <Paragraph>
              You currently don’t have access to any spaces.
              <br />
              Talk with your organization admin to access a space.
            </Paragraph>
          </Typography>
        </EmptyStateContainer>
      )}
    </div>
  );
};

EmptyHome.propTypes = {
  orgId: PropTypes.string,
};
