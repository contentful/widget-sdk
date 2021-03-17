import React from 'react';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { TextField } from '@contentful/forma-36-react-components';
import { styles } from './styles';
import { isEqual } from 'lodash';
import { AppDefinition } from 'contentful-management/types';
import { ValidationError } from './types';

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

  return (
    <>
      {hostingEnabled && <div>HELLo</div>}
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
    </>
  );
}
