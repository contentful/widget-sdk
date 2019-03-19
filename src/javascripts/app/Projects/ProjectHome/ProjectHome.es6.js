import React, { useState } from 'react';
import { connect } from 'react-redux';
import { isMissingRequiredDatasets } from 'redux/selectors/datasets.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import { TextInput, Textarea, Button, Notification } from '@contentful/forma-36-react-components';
import { getDatasets } from 'redux/selectors/datasets.es6';
import { PROJECTS } from 'redux/datasets.es6';
import ROUTES from 'redux/routes.es6';
import { getPath } from 'redux/selectors/location.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';

import Members from './Members.es6';
import Spaces from './Spaces.es6';

export default connect(
  state => {
    const isLoading = isMissingRequiredDatasets(state);
    const project =
      !isLoading &&
      getDatasets(state)[PROJECTS][
        ROUTES.organization.children.projects.children.project.test(getPath(state)).projectId
      ];

    return {
      isLoading: isLoading || !project,
      project,
      orgId: getOrgId(state)
    };
  },
  dispatch => ({
    _save: orgId => async project => {
      dispatch({
        type: 'SAVE_PROJECT',
        payload: {
          dataset: PROJECTS,
          item: project
        }
      });

      const backend = createMicroBackendsClient({
        backendName: 'projects',
        baseUrl: `/organizations/${orgId}/projects`
      });

      try {
        await backend.call(null, {
          method: 'POST',
          body: JSON.stringify(project),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        Notification.success('saved');
      } catch (e) {
        Notification.error(e);
      }
    },
    _delete: orgId => async projectId => {
      const backend = createMicroBackendsClient({
        backendName: 'projects',
        baseUrl: `/organizations/${orgId}/projects/${projectId}`
      });

      try {
        await backend.call(null, {
          method: 'DELETE'
        });
        dispatch({
          type: 'REMOVE_FROM_DATASET',
          payload: {
            dataset: PROJECTS,
            id: projectId
          },
          meta: { pending: true }
        });
        Notification.success('deleted');
      } catch (e) {
        Notification.error(e);
      }
    }
  }),
  (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    save: dispatchProps._save(stateProps.orgId),
    deleteProject: dispatchProps._delete(stateProps.orgId)
  })
)(({ project, isLoading, onReady, save, deleteProject }) => {
  if (isLoading === false) {
    onReady();
  }
  if (isLoading) {
    return <FetcherLoading message="Loading project..." />;
  }

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [memberIds, setProjectMemberIds] = useState(project.memberIds);
  const [spaceIds, setProjectSpaceIds] = useState(project.spaceIds);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="project-home">
      <div className="project-home__details">
        <h2>{name}</h2>
        <TextInput
          value={name}
          onChange={({ target: { value } }) => setDirty(true) || setName(value)}
        />
        <div>{description}</div>
        <Textarea
          placeholder="description"
          value={description}
          onChange={({ target: { value } }) => setDirty(true) || setDescription(value)}
        />
      </div>
      <div className="project-home__relations">
        <Members
          {...{
            projectMemberIds: memberIds,
            setProjectMemberIds: ids => setDirty(true) || setProjectMemberIds(ids)
          }}
        />
        <Spaces
          {...{
            projectSpaceIds: spaceIds,
            setProjectSpaceIds: ids => setDirty(true) || setProjectSpaceIds(ids)
          }}
        />
      </div>
      <div>
        <Button
          disabled={!dirty}
          onClick={() =>
            setDirty(false) || save({ ...project, name, description, memberIds, spaceIds })
          }>
          Save
        </Button>
        <Button
          style={{ marginLeft: '.4rem' }}
          buttonType="negative"
          onClick={() => deleteProject(project.sys.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
});
