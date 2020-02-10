import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Form, SelectField, Option } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import { getOrgsAndSpaces, getEnvsFor, getLastUsedSpace } from './util';

function goToInstallation(spaceId, environmentId, appId) {
  Navigator.go({
    path: 'spaces.detail.environment.apps.detail',
    params: {
      spaceId,
      environmentId,
      appId: `private_${appId}`,
      referrer: 'app-management'
    },
    options: {
      location: 'replace'
    }
  });
}

export default function AppInstallModal({ definition, onClose }) {
  const [redirecting, setRedirecting] = useState(false);
  const [orgSpaces, setOrgSpaces] = useState([]);
  const [spaceEnvs, setSpaceEnvs] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('');

  useEffect(() => {
    async function getSpaces() {
      const orgsAndSpaces = await getOrgsAndSpaces();
      const lastUsedSpace = getLastUsedSpace();

      setOrgSpaces(orgsAndSpaces);
      setSelectedSpace(lastUsedSpace);
    }

    getSpaces();
  }, []);

  useEffect(() => {
    async function getEnvs() {
      const environments = await getEnvsFor(selectedSpace);

      setSpaceEnvs(environments);
      setSelectedEnv(environments[0].sys.id);
    }

    if (selectedSpace !== '') {
      setSelectedEnv('');
      getEnvs();
    }
  }, [selectedSpace]);

  if (!definition) {
    return null;
  }

  const onContinue = () => {
    setRedirecting(true);
    goToInstallation(selectedSpace, selectedEnv, definition.sys.id);
  };

  return (
    <Modal
      position="center"
      isShown
      title={`Install ${definition.name} to a space`}
      onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Form>
              <SelectField
                labelText="Select a space"
                id="spaceSelection"
                name="spaceSelection"
                required
                value={selectedSpace}
                onChange={e => setSelectedSpace(e.target.value)}>
                <Option value="" disabled>
                  Select a space
                </Option>
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
                id="envSelection"
                name="envSelection"
                required
                onChange={e => setSelectedEnv(e.target.value)}
                value={selectedEnv}>
                <Option value="" disabled>
                  Select an environment
                </Option>
                {spaceEnvs.map(env => (
                  <Option key={env.sys.id} value={env.sys.id}>
                    {env.name}
                  </Option>
                ))}
              </SelectField>
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button
              onClick={onContinue}
              buttonType="primary"
              loading={redirecting}
              disabled={redirecting}
              testId="continue-button">
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
  definition: PropTypes.object,
  onClose: PropTypes.func.isRequired
};
