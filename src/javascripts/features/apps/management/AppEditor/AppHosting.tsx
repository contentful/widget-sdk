import React from 'react';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { TextInput, FormLabel, TextField, Switch } from '@contentful/forma-36-react-components';
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
};

interface AppHostingProps {
  definition: AppDefinition;
  onChange: (appDefinition: AppDefinition) => void;
  errorPath?: string[];
  errors?: ValidationError[];
  disabled: boolean;
  clearErrorForField: (error: string) => void;
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
            <TextInput
              className={styles.input()}
              name="app-src"
              id="app-src"
              testId="app-src-input"
              value={definition.src || ''}
              helpText="Only required if your app renders into locations within the Contentful web app. Public URLs must use HTTPS."
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                clearErrorForField([...errorPath, 'src']);
                onChange({ ...definition, src: e.target.value.trim() });
              }}
              validationMessage={
                errors.find((error) => isEqual(error.path, [...errorPath, 'src']))?.details
              }
              textInputProps={{ disabled }}
            />
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            clearErrorForField([...errorPath, 'src']);
            onChange({ ...definition, src: e.target.value.trim() });
          }}
          validationMessage={
            errors.find((error) => isEqual(error.path, [...errorPath, 'src']))?.details
          }
          textInputProps={{ disabled }}
        />
      )}
    </>
  );
}
