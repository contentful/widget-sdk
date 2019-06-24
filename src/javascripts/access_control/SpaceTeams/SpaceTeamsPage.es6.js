import React, { useState } from 'react';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import { fetchAllWithIncludes } from 'data/CMA/FetchAll.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

import { getTeamsSpaceMembershipsOfSpace, updateTeamSpaceMembership, getAllTeams } from '../TeamRepository.es6';
import { getSectionVisibility } from '../AccessChecker/index.es6';
import { getModule } from 'NgRegistry.es6';

import styles from './styles.es6';
import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation.es6';

export const Fetcher = createFetcherComponent(async ({ spaceId, orgId }) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const orgEndpoint = createOrganizationEndpoint(orgId);

  const promises = [
    getTeamsSpaceMembershipsOfSpace(spaceEndpoint),
    (await fetchAllWithIncludes(spaceEndpoint, ['roles'], 100)).items,
    getAllTeams(orgEndpoint)
  ];

  return await Promise.all(promises);
});

const SpaceTeamsPage = ({ spaceId, onReady }) => {
  const [isPending, setPending] = useState(false);

  const spaceContext = getModule('spaceContext');
  const {
    sys: { id: orgId }
  } = spaceContext.organization;

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

        const onUpdateTeamSpaceMembership = async (membership, admin, roles) => {
          setPending(true);
          try {
            return await updateTeamSpaceMembership(
              createSpaceEndpoint(spaceId),
              membership,
              admin,
              roles
            );
          } finally {
            setPending(false);
          }
        };

        const [teamSpaceMemberships, availableRoles, teams] = data || [[]];
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
              {...{
                memberships: sortedMemberships,
                availableRoles,
                isLoading,
                isPending,
                teams,
                onUpdateTeamSpaceMembership
              }}
            />
          </>
        );
      }}
    </Fetcher>
  );
};

SpaceTeamsPage.propTypes = {
  spaceId: PropTypes.string.isRequired,
  onReady: PropTypes.func.isRequired
};

export default SpaceTeamsPage;
