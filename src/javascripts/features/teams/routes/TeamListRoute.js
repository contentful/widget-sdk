import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { TeamList } from '../components/TeamList';
import { TeamsEmptyState } from '../components/TeamsEmptyState';

const TeamListFetcher = createFetcherComponent(async ({ orgId }) => {
  const [organization, hasTeamsEnabled] = await Promise.all([
    getOrganization(orgId),
    getOrgFeature(orgId, 'teams', true),
  ]);

  const readOnlyPermission = !isOwnerOrAdmin(organization);
  return { readOnlyPermission, hasTeamsEnabled };
});

export class TeamListRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  render() {
    return (
      <React.Fragment>
        <DocumentTitle title="Team Details" />
        <TeamListFetcher orgId={this.props.orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading />;
            }
            if (isError) {
              return <StateRedirect path="settings" />;
            }

            if (!data.hasTeamsEnabled) {
              return (
                <TeamsEmptyState
                  isLegacy={true}
                  isAdmin={!data.readOnlyPermission}
                  orgId={this.props.orgId}
                />
              );
            }

            return (
              <TeamList readOnlyPermission={data.readOnlyPermission} orgId={this.props.orgId} />
            );
          }}
        </TeamListFetcher>
      </React.Fragment>
    );
  }
}
