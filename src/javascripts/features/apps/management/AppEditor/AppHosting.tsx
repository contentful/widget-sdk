import React from 'react';
import { FLAGS, getVariation } from 'LaunchDarkly';
import {
  TextInput,
  FormLabel,
  TextField,
  Switch,
  ValidationMessage,
  HelpText,
} from '@contentful/forma-36-react-components';
import { styles } from './styles';
import { isEqual } from 'lodash';
import { AppDefinition } from 'contentful-management/types';
import { ValidationError } from './types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const appHostingStyles = {
  hostingSwitch: css({
    marginBottom: tokens.spacingS,
  }),
  additionalInformation: css({
    marginTop: tokens.spacingXs,
  }),
};

interface AppHostingProps {
  definition: AppDefinition;
  onChange: (appDefinition: AppDefinition) => void;
  errorPath?: string[];
  errors?: ValidationError[];
  disabled: boolean;
  clearErrorForField: (error: string[]) => void;
}

export function AppHosting({
  definition,
  errorPath,
  onChange,
  disabled,
  errors,
  clearErrorForField,
}: AppHostingProps) {
  const [hostingEnabled, setHostingEnabled] = React.useState(false);

  React.useEffect(() => {
    getVariation(FLAGS.APP_HOSTING_UI).then((value) => setHostingEnabled(value));
  }, []);

  const [isAppHosting, setIsAppHosting] = React.useState(!definition.src);

  const validationMessage = React.useMemo(
    () =>
      errors?.find((error) => isEqual(error.path, errorPath ? [...errorPath, 'src'] : ['src']))
        ?.details,
    [errorPath, errors]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearErrorForField(errorPath ? [...errorPath, 'src'] : ['src']);
    onChange({ ...definition, src: e.target.value.trim() });
  };

  return (
    <>
      {hostingEnabled ? (
        <>
          <FormLabel htmlFor="app-hosting">Frontend</FormLabel>
          <Switch
            className={appHostingStyles.hostingSwitch}
            isChecked={isAppHosting}
            onToggle={setIsAppHosting}
            labelText="Hosted by Contentful"
            id="app-hosting"
          />
          {isAppHosting ? (
            <div>DROPZONE</div>
          ) : (
            <div className={styles.input()}>
              <TextInput
                name="app-src"
                id="app-src"
                testId="app-src-input"
                error={!!validationMessage}
                value={definition.src || ''}
                onChange={onInputChange}
                disabled={disabled}
              />
              <HelpText className={appHostingStyles.additionalInformation}>
                Only required if your app renders into locations within the Contentful web app.
                Public URLs must use HTTPS.
              </HelpText>
              {validationMessage && (
                <ValidationMessage className={appHostingStyles.additionalInformation}>
                  {validationMessage}
                </ValidationMessage>
              )}
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
