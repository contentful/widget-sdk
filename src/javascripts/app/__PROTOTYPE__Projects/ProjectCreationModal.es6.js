import React from 'react';
import PropTypes from 'prop-types';
import { connect, Provider } from 'react-redux';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { go } from 'states/Navigator.es6';
import * as random from 'utils/Random.es6';
import {
  Modal,
  Button,
  TextField,
  Notification,
  Note
} from '@contentful/forma-36-react-components';
import store from 'redux/store.es6';

import { __PROTOTYPE__PROJECTS } from 'redux/datasets.es6';

class ProjectCreationModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    isShown: PropTypes.bool.isRequired,
    orgId: PropTypes.string.isRequired,
    addProject: PropTypes.func.isRequired
  };
  state = {
    error: null,
    isPending: false,
    validationMessage: '',

    name: '',
    description: ''
  };

  submit = async () => {
    const { onClose, orgId, addProject } = this.props;
    const { name, description } = this.state;
    if (!name) {
      this.setState({ validationMessage: 'Please provide a project name' });
      return;
    }
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      withAuth: true,
      baseUrl: `/organizations/${orgId}/projects`
    });

    this.setState({
      isPending: true
    });

    const body = {
      name,
      description,
      spaceIds: [],
      memberIds: [],
      sys: { id: random.id() }
    };
    addProject(body);

    const resp = await backend.call(null, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (resp.status > 299) {
      Notification.error('Could not create project');
      return;
    }

    const project = await resp.json();

    await go({
      path: ['projects', 'home'],
      params: {
        orgId,
        projectId: project.sys.id
      }
    });

    onClose(true);
  };

  updateName = ({ target: { value } }) => {
    this.setState({
      name: value
    });
  };

  updateDescription = ({ target: { value } }) => {
    this.setState({
      description: value
    });
  };

  render() {
    const { isShown, onClose } = this.props;

    const { name, description, isPending, validationMessage } = this.state;

    return (
      <Modal title="Create project" isShown={isShown} onClose={onClose}>
        {() => (
          <React.Fragment>
            <Modal.Header title="Create a project" />
            <Modal.Content>
              <span>
                Projects helps you keep track of your work. Create a project, link the relevant
                spaces and users, and share information with your team about the context of the
                work.
              </span>
              <TextField
                style={{ marginTop: '1rem' }}
                name="projectName"
                id="projectName"
                labelText="Project name"
                value={name}
                onChange={this.updateName}
                disabled={isPending}
                textInputProps={{ autoFocus: true }}
                required
                validationMessage={validationMessage}
              />
              <TextField
                style={{ marginTop: '1rem' }}
                name="description"
                id="description"
                textarea
                labelText="Description"
                value={description}
                onChange={this.updateDescription}
                disabled={isPending}
              />
              <Note style={{ marginTop: '1rem' }}>
                Please note: Projects is an experimental feature so we haven’t yet built it with our
                usual polish. Help us decide if we should! Share your feedback with us{' '}
                <a
                  href="mailto:squad-hejo+feedback@contentful.com"
                  target="_blank"
                  rel="noopener noreferrer">
                  here
                </a>{' '}
                or through your Customer Success Manager.
              </Note>
            </Modal.Content>
            <Modal.Controls>
              <Button
                buttonType="positive"
                disabled={isPending}
                loading={isPending}
                onClick={this.submit}>
                {isPending && 'Creating...'}
                {!isPending && 'Create'}
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}

const Connected = connect(
  null,
  (dispatch, { orgId }) => ({
    addProject: project =>
      dispatch({
        type: 'ADD_TO_DATASET',
        payload: {
          dataset: __PROTOTYPE__PROJECTS,
          item: project,
          orgId
        }
      })
  })
)(ProjectCreationModal);

export async function open(orgId) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <Provider store={store}>
      <Connected key={Date.now()} isShown={isShown} onClose={onClose} orgId={orgId} />
    </Provider>
  ));
}
