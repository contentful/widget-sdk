import React from 'react';
import PropTypes from 'prop-types';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { user$ } from 'services/TokenStore.es6';
import * as K from 'utils/kefir.es6';
import { go } from 'states/Navigator.es6';

import { Modal, Button, TextField } from '@contentful/forma-36-react-components';

class ProjectCreationModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    isShown: PropTypes.bool.isRequired,
    orgId: PropTypes.string.isRequired
  };
  state = {
    error: null,
    isPending: false,
    validationMessage: '',

    name: '',
    description: ''
  };

  submit = async () => {
    const { onClose, orgId } = this.props;
    const { name, description } = this.state;
    if (!name) {
      this.setState({ validationMessage: 'Please provide a project name' });
      return;
    }
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    this.setState({
      isPending: true
    });

    const currentUser = K.getValue(user$);

    const body = {
      name,
      description,
      spaceIds: [],
      memberIds: [currentUser.sys.id]
    };

    const resp = await backend.call(null, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });

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
              <TextField
                name="projectName"
                id="projectName"
                labelText="Project name"
                value={name}
                onChange={this.updateName}
                disabled={isPending}
                required
                validationMessage={validationMessage}
              />
              <TextField
                name="description"
                id="description"
                textarea
                labelText="Description"
                value={description}
                onChange={this.updateDescription}
                disabled={isPending}
              />
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

export async function open(orgId) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <ProjectCreationModal key={Date.now()} isShown={isShown} onClose={onClose} orgId={orgId} />
  ));
}
