import React from 'react';
import PropTypes from 'prop-types';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

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

  return project;
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

          const project = data;

          return <ProjectHome project={project} />;
        }}
      </ProjectFetcher>
    );
  }
}
