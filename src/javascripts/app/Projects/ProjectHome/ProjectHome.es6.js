import React, { useState } from 'react';
import { connect } from 'react-redux';
import { isMissingRequiredDatasets } from 'redux/selectors/datasets.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import { TextInput, Textarea } from '@contentful/forma-36-react-components';

import Members from './Members.es6';
import Spaces from './Spaces.es6';

export default connect(state => ({
  isLoading: isMissingRequiredDatasets(state)
}))(({ project, isLoading }) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [projectMemberIds, setProjectMemberIds] = useState(project.memberIds);
  const [projectSpaceIds, setProjectSpaceIds] = useState(project.spaceIds);

  if (isLoading) {
    return <FetcherLoading message="Loading project..." />;
  }

  return (
    <div className="project-home">
      <div className="project-home__details">
        <h2>{name}</h2>
        <TextInput value={name} onChange={({ target: { value } }) => setName(value)} />
        <div>{description}</div>
        <Textarea value={description} onChange={({ target: { value } }) => setDescription(value)} />
      </div>
      <div className="project-home__relations">
        <Members {...{ projectMemberIds, setProjectMemberIds }} />
        <Spaces {...{ projectSpaceIds, setProjectSpaceIds }} />
      </div>
    </div>
  );
});
