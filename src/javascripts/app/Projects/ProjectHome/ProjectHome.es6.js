import React from 'react';
import { connect } from 'react-redux';
import { isMissingRequiredDatasets } from 'redux/selectors/datasets.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import { TextInput, Textarea } from '@contentful/forma-36-react-components';

import Members from './Members.es6';
import Spaces from './Spaces.es6';

export default connect(state => ({
  isLoading: isMissingRequiredDatasets(state)
}))(({ project, isLoading }) => {
  if (isLoading) {
    return <FetcherLoading message="Loading project..." />;
  }

  return (
    <div className="project-home">
      <div className="project-home__details">
        <h2>{project.name}</h2>
        <TextInput value={project.name} />
        <Textarea value={project.description} />
      </div>
      <div className="project-home__relations">
        <Members projectMemberIds={project.memberIds} />
        <Spaces projectSpaceIds={project.spaceIds} />
      </div>
    </div>
  );
});
