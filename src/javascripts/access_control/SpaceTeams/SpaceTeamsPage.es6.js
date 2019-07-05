import React from 'react';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

import { getTeamsSpaceMembershipsOfSpace, getAllTeams } from '../TeamRepository.es6';
import { getSectionVisibility } from '../AccessChecker/index.es6';
import { getModule } from 'NgRegistry.es6';

import styles from './styles.es6';
import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation.es6';

export const Fetcher = createFetcherComponent(async ({ spaceId, orgId }) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const orgEndpoint = createOrganizationEndpoint(orgId);

  const promises = [getTeamsSpaceMembershipsOfSpace(spaceEndpoint), getAllTeams(orgEndpoint)];

  return await Promise.all(promises);
});

export default class SpaceTeamsPage extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };

  render() {
    const spaceContext = getModule('spaceContext');
    const {
      sys: { id: orgId }
    } = spaceContext.organization;

    const { spaceId, onReady } = this.props;
    onReady();

    if (!getSectionVisibility().teams) {
      return <ForbiddenPage />;
    }

    return (
      <Fetcher orgId={orgId} spaceId={spaceId} onReady={onReady}>
        {({ isLoading, isError, data }) => {
          if (isError) {
            return (
              <div className={styles.contentAlignment}>
                <UnknownErrorMessage />
              </div>
            );
          }

          const [teamSpaceMemberships, teams] = data || [[], []];

          const sortedMemberships = teamSpaceMemberships.sort(
            (
              {
                sys: {
                  team: { name: nameA }
                }
              },
              {
                sys: {
                  team: { name: nameB }
                }
              }
            ) => nameA.localeCompare(nameB)
          );

          return (
            <>
              <DocumentTitle title="Teams in Space" />
              <SpaceTeamsPagePresentation
                memberships={sortedMemberships}
                teams={teams}
                isLoading={isLoading}
              />
            </>
          );
        }}
      </Fetcher>
    );
  }
}
