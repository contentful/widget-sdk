import {
  Button,
  Note,
  Notification,
  Paragraph,
  TextLink,
  Workbench,
  Flex,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import DocumentTitle from 'components/shared/DocumentTitle';
import { css } from 'emotion';
import React from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { AppEditor, validate } from './AppEditor';
import { ManagementApiClient } from './ManagementApiClient';
import { ValidationError } from './AppEditor';
import { HostingStateProvider } from './AppDetails/HostingStateProvider';
import { AppDetailsStateContext } from './AppDetails/AppDetailsStateContext';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

const styles = {
  spacerXl: css({
    marginBottom: tokens.spacingXl,
  }),
};

const BUILDING_APPS_URL =
  'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/';

interface NewAppProps {
  goToDefinition: (appId: string) => void;
  goToListView: () => void;
  orgId: string;
}

export const NewApp = (props: NewAppProps) => {
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const { draftDefinition } = React.useContext(AppDetailsStateContext);

  const save = async () => {
    const validationErrors = validate(draftDefinition, []);
    if (errors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setBusy(true);

    try {
      const saved = await ManagementApiClient.save(draftDefinition);
      Notification.success('App created successfully.');
      props.goToDefinition(saved.sys.id);
    } catch (err) {
      if (err.status === 422) {
        setErrors(
          err.data.details.errors.map((error) => {
            if (
              error.path[0] === 'locations' &&
              typeof error.path[1] === 'number' &&
              draftDefinition.locations
            ) {
              error.path[1] = draftDefinition.locations[error.path[1]].location;
            }
            return error;
          })
        );

        Notification.error(ManagementApiClient.VALIDATION_MESSAGE);
      } else {
        Notification.error("Something went wrong. Couldn't create app.");
      }
    }

    setBusy(false);
  };

  return (
    <Workbench>
      <DocumentTitle title="Apps" />
      <Workbench.Header
        title="Create app"
        onBack={props.goToListView}
        icon={<ProductIcon icon="Apps" size="large" />}
        actions={
          <Flex alignItems="center" alignSelf="center">
            <Button
              loading={busy}
              disabled={busy}
              buttonType="positive"
              onClick={save}
              testId="app-create">
              Create
            </Button>
          </Flex>
        }
      />
      <Workbench.Content type="text">
        <Note className={styles.spacerXl}>
          <Paragraph>
            Build apps for Contentful to extend the core functionality of the web app and optimize
            the workflow of editors. Learn{' '}
            <TextLink
              href={withInAppHelpUtmParams(BUILDING_APPS_URL)}
              target="_blank"
              rel="noopener noreferrer">
              how to build your first app
            </TextLink>{' '}
            to get started.
          </Paragraph>
        </Note>
        <HostingStateProvider defaultValue={false} bundles={{ items: [] }} orgId={props.orgId}>
          <AppEditor
            errors={errors}
            onErrorsChange={(changedErrors) => setErrors(changedErrors)}
            disabled={busy}
          />
        </HostingStateProvider>
      </Workbench.Content>
    </Workbench>
  );
};
