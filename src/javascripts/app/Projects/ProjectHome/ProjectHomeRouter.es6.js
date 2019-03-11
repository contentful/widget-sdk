import React from 'react';
import PropTypes from 'prop-types';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces, getUsers } from 'access_control/OrganizationMembershipRepository.es6';

import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';

const ProjectFetcher = createFetcherComponent(async ({ orgId, projectId }) => {
  const backend = createMicroBackendsClient({
    backendName: 'projects',
    baseUrl: `/organizations/${orgId}/projects`
  });

  const resp = await backend.call(`/${projectId}`);

  if (resp.status > 299) {
    throw new Error('Not found');
  }

  const project = await resp.json();

  const { spaceIds, memberIds } = project;

  const orgEndpoint = createOrganizationEndpoint(orgId);
  const spaces = (await getAllSpaces(orgEndpoint)).filter(space => spaceIds.includes(space.sys.id));
  const members = (await getUsers(orgEndpoint, { 'sys.id[in]': memberIds })).items;

  return { project, spaces, members };
});

import ProjectHome from './ProjectHome.es6';

export default class ProjectHomeRouter extends React.Component {
  static propTypes = {
    onReady: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId, projectId } = this.props;

    return (
      <ProjectFetcher orgId={orgId} projectId={projectId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading project..." />;
          }

          if (isError) {
            return <ForbiddenPage />;
          }

          const { project, spaces, members } = data;

          return <ProjectHome project={project} spaces={spaces} members={members} />;
        }}
      </ProjectFetcher>
    );
  }
}
