import React from 'react';
import PropTypes from 'prop-types';

import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

import { getTeamsSpaceMembershipsOfSpace } from '../TeamRepository.es6';
import { getSectionVisibility } from '../AccessChecker/index.es6';

import styles from './styles.es6';
import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation.es6';

const Fetcher = createFetcherComponent(async ({ spaceId }) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId);

  const promises = [getTeamsSpaceMembershipsOfSpace(spaceEndpoint)];

  return await Promise.all(promises);
});

export default class SpaceTeamsPage extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };

  render() {
    const { spaceId, onReady } = this.props;
    onReady();
    if (!getSectionVisibility().teams) {
      return <ForbiddenPage />;
    }

    return (
      <Fetcher spaceId={spaceId} onReady={onReady}>
        {({ isLoading, isError, data }) => {
          if (isError) {
            return (
              <div className={styles.contentAlignment}>
                <UnknownErrorMessage />
              </div>
            );
          }

          const [teamSpaceMemberships] = data || [[]];
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
              <SpaceTeamsPagePresentation memberships={sortedMemberships} isLoading={isLoading} />
            </>
          );
        }}
      </Fetcher>
    );
  }
}
