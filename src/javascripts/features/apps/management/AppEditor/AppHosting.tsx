import React from 'react';
import { FLAGS, getVariation } from 'core/feature-flags';
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
import { DataLink } from './types';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import { ActiveBundle } from '../AppBundle/ActiveBundle';
import { AppDetailsStateContext } from '../AppDetails/AppDetailsStateContext';

const appHostingStyles = {
  hostingSwitch: css({
    marginBottom: tokens.spacingM,
    fontWeight: tokens.fontWeightMedium,
  }),
  additionalInformation: css({
    marginTop: tokens.spacingXs,
  }),
};

// needed until management is updated with bundle defintion
export type AppDefinitionWithBundle = AppDefinition & { bundle?: DataLink };

interface AppHostingProps {
  errorPath?: string[];
  errors?: ValidationError[];
  disabled: boolean;
  goToTab?: (tab: string) => void;
  clearErrorForField: (error: string[]) => void;
}

export function AppHosting({
  errorPath = [],
  disabled,
  errors = [],
  clearErrorForField,
  goToTab,
}: AppHostingProps) {
  const [hostingEnabled, setHostingEnabled] = React.useState(false);

  const { draftDefinition, setDraftDefinition, resetDefinitionBundle } =
    React.useContext(AppDetailsStateContext);

  React.useEffect(() => {
    getVariation(FLAGS.APP_HOSTING_UI, {
      organizationId: draftDefinition.sys.organization.sys.id,
    }).then((value) => setHostingEnabled(value));
  }, [draftDefinition.sys.organization.sys.id]);

  const hostingState = React.useContext(HostingStateContext);

  const validationMessage = React.useMemo(
    () => errors?.find((error) => isEqual(error.path, [...errorPath, 'src']))?.details,
    [errorPath, errors]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearErrorForField([...errorPath, 'src']);
    setDraftDefinition({ ...draftDefinition, src: e.target.value.trim() });
  };

  const renderSwitch = () => (
    <Switch
      className={appHostingStyles.hostingSwitch}
      isDisabled={!draftDefinition.sys.id}
      isChecked={hostingState.isAppHosting}
      onToggle={(value) => {
        hostingState.setIsAppHosting(value);
        resetDefinitionBundle();
      }}
      labelText="Hosted by Contentful"
      id="app-hosting"
    />
  );

  return (
    <>
      {hostingEnabled || draftDefinition.bundle ? (
        <>
          <FormLabel htmlFor="app-hosting">Frontend</FormLabel>
          <Flex>
            {!draftDefinition.sys.id ? (
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
            <>
              <ActiveBundle
                link={
                  goToTab
                    ? { title: 'View all bundles', onLinkClick: () => goToTab('bundles') }
                    : undefined
                }
              />
            </>
          ) : (
            <div className={styles.input()}>
              <TextInput
                name="app-src"
                id="app-src"
                testId="app-src-input"
                placeholder="e.g. http://localhost:1234"
                error={!!validationMessage}
                value={draftDefinition.src || ''}
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
          value={draftDefinition.src || ''}
          helpText="Only required if your app renders into locations within the Contentful web app. Public URLs must use HTTPS."
          onChange={onInputChange}
          validationMessage={validationMessage}
          textInputProps={{ disabled }}
        />
      )}
    </>
  );
}
