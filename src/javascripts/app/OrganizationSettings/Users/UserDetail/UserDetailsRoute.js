import React from 'react';
import PropTypes from 'prop-types';
import UserDetail from './UserDetails';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import DocumentTitle from 'components/shared/DocumentTitle';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getMembership, getUser } from 'access_control/OrganizationMembershipRepository';
import { getUserName } from 'utils/UserUtils';
import { getValue } from 'utils/kefir';
import { user$ } from 'services/TokenStore';

import { logError } from 'services/logger';
import { getOrgFeature } from 'data/CMA/ProductCatalog';

const getCreatedBy = async (endpoint, membership) => {
  try {
    return await getUser(endpoint, membership.sys.createdBy.sys.id);
  } catch {
    // user is not a member of the org. just return the link object
    return membership.sys.createdBy;
  }
};

const UserDetailFetcher = createFetcherComponent(async ({ orgId, userId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const orgMembership = await getMembership(endpoint, userId);

  const [user, hasTeamsFeature] = await Promise.all([
    getUser(endpoint, orgMembership.sys.user.sys.id),
    getOrgFeature(orgId, 'teams', false)
  ]);

  const createdBy = await getCreatedBy(endpoint, orgMembership);
  const initialMembership = { ...orgMembership, sys: { ...orgMembership.sys, user, createdBy } };
  const currentUser = getValue(user$);
  const isSelf = currentUser && currentUser.sys.id === initialMembership.sys.user.sys.id;

  return {
    initialMembership,
    isSelf,
    hasTeamsFeature
  };
});

export default class UserDetailRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId, userId } = this.props;

    return (
      <OrgAdminOnly orgId={orgId}>
        <UserDetailFetcher orgId={orgId} userId={userId}>
          {({ isLoading, isError, error, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading user..." />;
            }
            if (isError) {
              logError('Failed to load org user page', { error });
              return <StateRedirect path="^.list" />;
            }
            const user = data.initialMembership.sys.user;

            return (
              <React.Fragment>
                <DocumentTitle title={[getUserName(user), 'Users']} />
                <UserDetail {...data} orgId={orgId} />
              </React.Fragment>
            );
          }}
        </UserDetailFetcher>
      </OrgAdminOnly>
    );
  }
}
