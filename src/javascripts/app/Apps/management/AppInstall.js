import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Form, SelectField, Option } from '@contentful/forma-36-react-components';
import { getSpaces, getOrganizations } from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createSpaceEnvRepo } from 'data/CMA/SpaceEnvironmentsRepo';

export default function AppInstallModal({ definition, onClose }) {
  const [orgSpaces, setOrgSpaces] = useState([]);
  const [spaceEnvs, setSpaceEnvs] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('');

  useEffect(() => {
    async function getSpace() {
      const orgs = await getOrganizations();
      const spaces = await getSpaces();

      const orgSpaceMap = spaces.reduce((acc, space) => {
        const orgId = space.organization.sys.id;

        if (acc[orgId]) {
          acc[orgId].push(space);
        } else {
          acc[orgId] = [space];
        }

        return acc;
      }, {});

      const orgAndSpaces = orgs.map(org => ({ org, spaces: orgSpaceMap[org.sys.id] }));

      setOrgSpaces(orgAndSpaces);
    }

    getSpace();
  }, []);

  useEffect(() => {
    async function getEnvs() {
      const spaceEndpoint = createSpaceEndpoint(selectedSpace, 'master');
      const spaceEnvRepo = createSpaceEnvRepo(spaceEndpoint);
      const { environments } = await spaceEnvRepo.getAll();

      setSpaceEnvs(environments);
    }

    if (selectedSpace !== '') {
      setSelectedEnv('');
      getEnvs();
    }
  }, [selectedSpace]);

  if (!definition) {
    return null;
  }

  return (
    <Modal position="top" isShown title={`Install ${definition.name} to a space`} onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Form>
              <SelectField
                labelText="Select a space"
                required
                value={selectedSpace}
                onChange={e => setSelectedSpace(e.target.value)}>
                <Option value="">Select a space</Option>
                {orgSpaces.map(({ org, spaces }) => (
                  <optgroup key={org.sys.id} label={org.name}>
                    {spaces.map(space => (
                      <Option key={space.sys.id} value={space.sys.id}>
                        {space.name}
                      </Option>
                    ))}
                  </optgroup>
                ))}
              </SelectField>
              <SelectField
                labelText="Select an environment"
                required
                onChange={e => setSelectedEnv(e.target.value)}
                value={selectedEnv}>
                <Option value="">Select an environment</Option>
                {spaceEnvs.map(env => (
                  <Option key={env.sys.id} value={env.sys.id}>
                    {env.name}
                  </Option>
                ))}
              </SelectField>
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={() => {}} buttonType="primary">
              Continue
            </Button>
            <Button onClick={onClose} buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

AppInstallModal.propTypes = {
  definition: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};
