import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Notification,
  Button,
  Paragraph,
  TextLink,
  Workbench,
  Note,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';
import DocumentTitle from 'components/shared/DocumentTitle';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'new-app',
  campaign: 'in-app-help',
});

const styles = {
  spacerM: css({
    marginBottom: tokens.spacingM,
  }),
  spacerXl: css({
    marginBottom: tokens.spacingXl,
  }),
  spacer2Xl: css({
    marginBottom: tokens.spacing2Xl,
  }),
  createButton: css({
    marginBottom: tokens.spacing4Xl,
  }),
};

const BUILDING_APPS_URL =
  'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/';

export default class NewApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      definition: ManagementApiClient.createDefinitionTemplateForOrg(props.orgId),
    };
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const saved = await ManagementApiClient.save(this.state.definition);
      Notification.success('App created successfully.');
      this.props.goToDefinition(saved.sys.id);
    } catch (err) {
      Notification.error(ManagementApiClient.VALIDATION_MESSAGE);
    }

    this.setState({ busy: false });
  };

  render() {
    const { definition, busy } = this.state;

    return (
      <Workbench>
        <DocumentTitle title="Apps" />
        <Workbench.Header
          title="Create app"
          onBack={this.props.goToListView}
          icon={<NavigationIcon icon="apps" size="large" color="green" />}></Workbench.Header>
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

          <div className={styles.spacer2Xl}>
            <AppEditor
              definition={definition}
              onChange={(definition) => this.setState({ definition })}
            />
          </div>
          <Button
            className={styles.createButton}
            loading={busy}
            disabled={busy}
            buttonType="positive"
            onClick={this.save}
            testId="app-create">
            Create app
          </Button>
        </Workbench.Content>
      </Workbench>
    );
  }
}

NewApp.propTypes = {
  goToDefinition: PropTypes.func.isRequired,
  goToListView: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired,
};
