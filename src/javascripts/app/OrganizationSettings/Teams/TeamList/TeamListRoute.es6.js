import React from 'react';
import PropTypes from 'prop-types';
import TeamList from './TeamList.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import createTeamService from '../TeamService.es6';

const TeamListFetcher = createFetcherComponent(({ orgId }) => {
  const service = createTeamService(orgId);
  return service.getAll();
});

export default class TeamListRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <TeamListFetcher orgId={orgId}>
          {({ isLoading, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading users..." />;
            }

            const { items } = data;
            return <TeamList orgId={orgId} initialTeams={items} />;
          }}
        </TeamListFetcher>
      </OrgAdminOnly>
    );
  }
}
