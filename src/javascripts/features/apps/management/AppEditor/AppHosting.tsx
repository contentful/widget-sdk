import React from 'react';
import { FLAGS, getVariation } from 'LaunchDarkly';
import {
  TextInput,
  FormLabel,
  TextField,
  Switch,
  HelpText,
  Tooltip,
  Flex,
} from '@contentful/forma-36-react-components';
import { styles } from './styles';
import { isEqual } from 'lodash';
import { AppDefinition } from 'contentful-management/types';
import { ValidationError } from './types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { DataLink, HostingDropzone } from './HostingDropzone';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';

const appHostingStyles = {
  hostingSwitch: css({
    marginBottom: tokens.spacingM,
  }),
  additionalInformation: css({
    marginTop: tokens.spacingXs,
  }),
};

// needed until management is updated with bundle defintion
export type AppDefinitionWithBundle = AppDefinition & { bundle?: DataLink };

interface AppHostingProps {
  definition: AppDefinitionWithBundle;
  onChange: (appDefinition: AppDefinitionWithBundle) => void;
  errorPath?: string[];
  errors?: ValidationError[];
  disabled: boolean;
  clearErrorForField: (error: string[]) => void;
}

export function AppHosting({
  definition,
  errorPath = [],
  onChange,
  disabled,
  errors = [],
  clearErrorForField,
}: AppHostingProps) {
  const [hostingEnabled, setHostingEnabled] = React.useState(false);

  React.useEffect(() => {
    getVariation(FLAGS.APP_HOSTING_UI, {
      organizationId: definition.sys.organization.sys.id,
    }).then((value) => setHostingEnabled(value));
  }, [definition.sys.organization.sys.id]);

  const hostingState = React.useContext(HostingStateContext);

  const validationMessage = React.useMemo(
    () => errors?.find((error) => isEqual(error.path, [...errorPath, 'src']))?.details,
    [errorPath, errors]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearErrorForField([...errorPath, 'src']);
    onChange({ ...definition, src: e.target.value.trim() });
  };

  const onAppBundleCreate = (bundle: DataLink) => {
    onChange({
      ...definition,
      src: undefined,
      bundle: { sys: { type: 'Link', linkType: 'AppBundle', id: bundle.sys.id } },
    });
  };

  const renderSwitch = () => (
    <Switch
      className={appHostingStyles.hostingSwitch}
      isDisabled={!definition.sys.id || !hostingState}
      isChecked={!!(hostingState && hostingState.isAppHosting)}
      onToggle={hostingState?.setIsAppHosting}
      labelText="Hosted by Contentful"
      id="app-hosting"
    />
  );

  return (
    <>
      {hostingEnabled || definition.bundle ? (
        <>
          <FormLabel htmlFor="app-hosting">Frontend</FormLabel>
          <Flex>
            {!definition.sys.id ? (
              <Tooltip
                place="top-start"
                content="Please create your app first to enable hosting by Contentful">
                {renderSwitch()}
              </Tooltip>
            ) : (
              renderSwitch()
            )}
          </Flex>
          {hostingState && hostingState.isAppHosting ? (
            <HostingDropzone onAppBundleCreated={onAppBundleCreate} definition={definition} />
          ) : (
            <div className={styles.input()}>
              <TextInput
                name="app-src"
                id="app-src"
                testId="app-src-input"
                placeholder="e.g. http://localhost:1234"
                error={!!validationMessage}
                value={definition.src || ''}
                onChange={onInputChange}
                disabled={disabled}
              />
              <HelpText className={appHostingStyles.additionalInformation}>
                Only required if your app renders into locations within the Contentful web app.
                Public URLs must use HTTPS.
              </HelpText>
              <ConditionalValidationMessage
                className={appHostingStyles.additionalInformation}
                errors={errors}
                path={[...errorPath, 'src']}
              />
            </div>
          )}
        </>
      ) : (
        <TextField
          className={styles.input()}
          name="app-src"
          id="app-src"
          labelText="App URL"
          testId="app-src-input"
          value={definition.src || ''}
          helpText="Only required if your app renders into locations within the Contentful web app. Public URLs must use HTTPS."
          onChange={onInputChange}
          validationMessage={validationMessage}
          textInputProps={{ disabled }}
        />
      )}
    </>
  );
}
