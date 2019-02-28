import React from 'react';
import PropTypes from 'prop-types';

import ModalLauncher from 'app/common/ModalLauncher.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { user$ } from 'services/TokenStore.es6';
import * as K from 'utils/kefir.es6';

import {
  Card,
  Spinner,
  Modal,
  Button,
  TextField,
  Select,
  Option,
  FormLabel,
  List,
  ListItem
} from '@contentful/forma-36-react-components';

class ProjectCreationModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    isShown: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  };
  state = {
    isLoading: true,
    error: null,
    isPending: false,
    allSpaces: [],

    projectName: '',
    description: '',
    selectedSpaces: []
  };

  async componentDidMount() {
    const { orgId } = this.props;

    const endpoint = createOrganizationEndpoint(orgId);

    let allSpaces;

    try {
      allSpaces = await getAllSpaces(endpoint);
    } catch (error) {
      this.setState({
        error,
        isLoading: false
      });
    }

    this.setState({
      isLoading: false,
      allSpaces
    });
  }

  submit = async () => {
    const { onClose, orgId } = this.props;
    const { projectName, description, selectedSpaces } = this.state;
    const backend = createMicroBackendsClient({
      backendName: 'projects',
      baseUrl: `/organizations/${orgId}/projects`
    });

    this.setState({
      isPending: true
    });

    const currentUser = K.getValue(user$);

    const body = {
      name: projectName,
      description,
      spaceIds: selectedSpaces.map(space => space.sys.id),
      memberIds: [currentUser.sys.id]
    };

    await backend.call(null, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    onClose(true);
  };

  selectSpace = ({ target: { value } }) => {
    this.setState(state => {
      const selectedSpaces = [].concat(state.selectedSpaces);
      const selectedSpace = state.allSpaces.find(space => space.sys.id === value);

      selectedSpaces.push(selectedSpace);

      return {
        selectedSpaces
      };
    });
  };

  updateName = ({ target: { value } }) => {
    this.setState({
      projectName: value
    });
  };

  updateDescription = ({ target: { value } }) => {
    this.setState({
      description: value
    });
  };

  render() {
    const { isShown, onClose } = this.props;

    const {
      projectName,
      description,
      selectedSpaces,
      allSpaces,
      isLoading,
      isPending
    } = this.state;

    const availableSpaces = allSpaces.filter(
      space => !selectedSpaces.find(ss => ss.sys.id === space.sys.id)
    );

    return (
      <Modal title="Create project" isShown={isShown} onClose={onClose}>
        {() => (
          <React.Fragment>
            {isLoading && (
              <Card padding="large">
                <Spinner size="large" />
              </Card>
            )}
            {!isLoading && (
              <React.Fragment>
                <Modal.Header title="Create a project" />
                <Modal.Content>
                  <TextField
                    name="projectName"
                    id="projectName"
                    labelText="Project name"
                    value={projectName}
                    onChange={this.updateName}
                    disabled={isPending}
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
                  <FormLabel>Spaces</FormLabel>
                  <Select onChange={this.selectSpace}>
                    <Option value="">Select space</Option>
                    {availableSpaces.map(space => (
                      <Option key={space.sys.id} value={space.sys.id}>
                        {space.name}
                      </Option>
                    ))}
                  </Select>
                  {Boolean(selectedSpaces.length) && (
                    <List>
                      {selectedSpaces.map(space => (
                        <ListItem key={space.sys.id}>{space.name}</ListItem>
                      ))}
                    </List>
                  )}
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
