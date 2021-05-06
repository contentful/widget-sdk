import React, { useState, useEffect } from 'react';
import { Button, Modal, SelectField, Option } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import { getOrgSpacesFor, getEnvsFor } from './util';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { AppDefinition, Space, Environment } from 'contentful-management/types';

function goToInstallation(spaceId, environmentId, appId, onClose) {
  Navigator.go({
    path: 'spaces.environment.apps.detail',
    params: {
      spaceId,
      environmentId,
      appId,
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

const getEnvAliases = (env) => {
  if (Array.isArray(env?.sys?.aliases)) {
    return env.sys.aliases;
  }

  return [];
};

const isMasterAliasedToEnv = (env) => {
  return getEnvAliases(env).some((a) => a.sys.id === 'master');
};

const formatEnvName = (env) => {
  const aliases = getEnvAliases(env);

  if (aliases.length) {
    return `${aliases[0].sys.id} > ${env.name}`;
  }

  return env.name;
};

interface AppInstallModalProps {
  definition: AppDefinition;
  onClose: () => void;
  isShown: boolean;
}
export const AppInstallModal: React.FC<AppInstallModalProps> = ({
  isShown,
  definition,
  onClose,
}) => {
  const [redirecting, setRedirecting] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceEnvs, setSpaceEnvs] = useState<Environment[]>([]);
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
    const env = spaceEnvs.find((e) => e.sys.id === selectedEnv);

    goToInstallation(
      selectedSpace,
      isMasterAliasedToEnv(env) ? 'master' : selectedEnv,
      definition.sys.id,
      onClose
    );
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedSpace(e.target.value)
                }>
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedEnv(e.target.value)
                }
                value={selectedEnv}>
                {spaceEnvs.map((env) => (
                  <Option key={env.sys.id} value={env.sys.id}>
                    {formatEnvName(env)}
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
};
