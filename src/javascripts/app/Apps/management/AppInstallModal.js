import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, SelectField, Option } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import { getOrgSpacesFor, getEnvsFor } from './util';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

function goToInstallation(spaceId, environmentId, appId, onClose) {
  Navigator.go({
    path: 'spaces.detail.environment.apps.detail',
    params: {
      spaceId,
      environmentId,
      appId: `private_${appId}`,
      referrer: 'app-management',
    },
    options: {
      location: 'replace',
    },
  }).then(() => onClose());
}

const styles = {
  form: css({
    '> div:first-child': css({
      marginBottom: tokens.spacingL,
    }),
  }),
};

export default function AppInstallModal({ isShown, definition, onClose }) {
  const [redirecting, setRedirecting] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [spaceEnvs, setSpaceEnvs] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('');

  useEffect(() => {
    async function getSpaces() {
      const spaces = await getOrgSpacesFor(definition.sys.organization.sys.id);

      setSpaces(spaces);
      setSelectedSpace(spaces[0].sys.id);
    }

    if (definition) {
      getSpaces();
    }
  }, [definition]);

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

  const onContinue = () => {
    setRedirecting(true);
    goToInstallation(selectedSpace, selectedEnv, definition.sys.id, onClose);
  };

  return (
    <Modal
      position="center"
      isShown={isShown}
      title={`Install ${definition.name} to a space`}
      onClose={onClose}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <div className={styles.form}>
              <SelectField
                labelText="Select a space"
                id="spaceSelection"
                name="spaceSelection"
                required
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}>
                {spaces.map((space) => (
                  <Option key={space.sys.id} value={space.sys.id}>
                    {space.name}
                  </Option>
                ))}
              </SelectField>
              <SelectField
                labelText="Select an environment"
                id="envSelection"
                name="envSelection"
                required
                onChange={(e) => setSelectedEnv(e.target.value)}
                value={selectedEnv}>
                {spaceEnvs.map((env) => (
                  <Option key={env.sys.id} value={env.sys.id}>
                    {env.name}
                  </Option>
                ))}
              </SelectField>
            </div>
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
  onClose: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
};
