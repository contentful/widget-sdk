import React, { useState } from 'react';
import { connect } from 'react-redux';
import { isMissingRequiredDatasets } from 'redux/selectors/datasets.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { css } from 'emotion';
import {
  TextInput,
  Textarea,
  Button,
  Notification,
  ModalConfirm
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { getDatasets } from 'redux/selectors/datasets.es6';
import { __PROTOTYPE__PROJECTS } from 'redux/datasets.es6';
import ROUTES from 'redux/routes.es6';
import { getPath } from 'redux/selectors/location.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import Members from './Members.es6';
import Spaces from './Spaces.es6';
import LinkSections from './LinkSections.es6';

const styles = {
  home: css({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflowY: 'auto',
    overflowX: 'hidden'
  }),
  content: css({
    paddingTop: '2rem',
    display: 'flex',
    justifyContent: 'space-around',
    maxWidth: '1080px',
    marginLeft: 'auto',
    marginRight: 'auto',
    '> *': {
      margin: tokens.spacingM
    }
  })
};

export default connect(
  state => {
    const isLoading = isMissingRequiredDatasets(state);
    const project =
      !isLoading &&
      getDatasets(state)[__PROTOTYPE__PROJECTS][
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
          dataset: __PROTOTYPE__PROJECTS,
          item: project
        }
      });

      const backend = createMicroBackendsClient({
        backendName: 'projects',
        withAuth: true,
        baseUrl: `/organizations/${orgId}/projects`
      });

      try {
        const res = await backend.call(null, {
          method: 'POST',
          body: JSON.stringify(project),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.status > 299) {
          Notification.error('Could not save project');
          return;
        }
        Notification.success('saved');
      } catch (e) {
        Notification.error(e);
      }
    },
    _delete: orgId => async projectId => {
      const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
        <ModalConfirm
          title="Delete Project"
          intent="negative"
          isShown={isShown}
          confirmLabel="Remove"
          onConfirm={() => onClose(true)}
          onCancel={() => onClose(false)}>
          <p>Do you really want to delete this project?</p>
        </ModalConfirm>
      ));

      if (!confirmation) {
        return;
      }

      const backend = createMicroBackendsClient({
        backendName: 'projects',
        withAuth: true,
        baseUrl: `/organizations/${orgId}/projects/${projectId}`
      });

      try {
        const res = await backend.call(null, {
          method: 'DELETE'
        });
        dispatch({
          type: 'REMOVE_FROM_DATASET',
          payload: {
            dataset: __PROTOTYPE__PROJECTS,
            id: projectId
          },
          meta: { pending: true }
        });
        if (res.status > 299) {
          Notification.error('Could not delete project');
          return;
        }
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
  onReady();
  if (isLoading) {
    return <FetcherLoading message="Loading project..." />;
  }

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [memberIds, setProjectMemberIds] = useState(project.memberIds);
  const [spaceIds, setProjectSpaceIds] = useState(project.spaceIds);
  const [linkSections, setLinkSections] = useState(project.linkSections || []);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className={styles.home}>
      <div className={styles.content}>
        <div className="project-home__details">
          {!editing && <h2>{name}</h2>}
          {editing && (
            <TextInput
              value={name}
              onChange={({ target: { value } }) => setDirty(true) || setName(value)}
            />
          )}
          {!editing && (
            <div>
              {description.split('\n').reduce((acc, cur, idx) => {
                if (idx === 0) {
                  return [...acc, cur];
                }
                return [...acc, <br key={idx} />, cur];
              }, [])}
            </div>
          )}
          {editing && (
            <Textarea
              rows={5}
              placeholder="description"
              value={description}
              onChange={({ target: { value } }) => setDirty(true) || setDescription(value)}
            />
          )}
          <LinkSections
            {...{
              editing,
              projectLinkSections: linkSections,
              setLinkSections: sections => setDirty(true) || setLinkSections(sections)
            }}
          />
        </div>
        <div className="project-home__relations">
          <Members
            {...{
              editing,
              projectMemberIds: memberIds,
              setProjectMemberIds: ids => setDirty(true) || setProjectMemberIds(ids)
            }}
          />
          <Spaces
            {...{
              editing,
              projectSpaceIds: spaceIds,
              setProjectSpaceIds: ids => setDirty(true) || setProjectSpaceIds(ids)
            }}
          />
        </div>
        <div>
          {!editing && (
            <Button style={{ margin: '.4rem' }} onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {editing && (
            <Button
              style={{ margin: '.4rem' }}
              disabled={!dirty}
              onClick={() =>
                setDirty(false) ||
                setEditing(false) ||
                save({ ...project, name, description, memberIds, spaceIds, linkSections })
              }>
              Save
            </Button>
          )}
          {!editing && (
            <Button
              style={{ margin: '.4rem' }}
              buttonType="negative"
              onClick={() => deleteProject(project.sys.id)}>
              Delete
            </Button>
          )}
          {editing && (
            <Button
              style={{ margin: '.4rem' }}
              buttonType="negative"
              onClick={() => {
                setName(project.name);
                setDescription(project.description);
                setProjectMemberIds(project.memberIds);
                setProjectSpaceIds(project.spaceIds);
                setLinkSections(project.linkSections || []);
                setEditing(false);
              }}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
