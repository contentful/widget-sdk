import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import Icon from 'ui/Components/Icon';
import {
  Notification,
  Button,
  Paragraph,
  TextLink,
  Workbench
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';
import { track } from 'analytics/Analytics';
import DocumentTitle from 'components/shared/DocumentTitle';

const styles = {
  spacerM: css({
    marginBottom: tokens.spacingM
  }),
  spacerXl: css({
    marginBottom: tokens.spacingXl
  }),
  createButton: css({
    marginBottom: tokens.spacing4Xl
  })
};

const BUILDING_APPS_URL =
  'https://www.contentful.com/developers/docs/extensibility/apps/building-apps/';

export default class NewApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      definition: ManagementApiClient.createDefinitionTemplateForOrg(props.orgId)
    };
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const saved = await ManagementApiClient.save(this.state.definition);
      Notification.success('App created successfully.');
      track('app_management:created', {
        definitionId: saved.sys.id
      });
      this.props.goToDefinition(saved.sys.id);
    } catch (err) {
      Notification.error(
        'Validation failed. Please check that you have provided an app Name, valid Source URL and/or Entry field types.'
      );
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
          icon={<Icon name="page-apps" scale={1} />}></Workbench.Header>
        <Workbench.Content type="text">
          <Paragraph className={styles.spacerM}>
            Build apps for Contentful to extend the core functionality of the web app and optimize
            the workflow of editors.
          </Paragraph>
          <Paragraph className={styles.spacerXl}>
            Learn more about{' '}
            <TextLink href={BUILDING_APPS_URL} target="_blank" rel="noopener noreferrer">
              building Contentful apps
            </TextLink>{' '}
            to get started.
          </Paragraph>
          <div className={styles.spacerXl}>
            <AppEditor
              definition={definition}
              onChange={definition => this.setState({ definition })}
            />
          </div>
          <Button
            className={styles.createButton}
            loading={busy}
            disabled={busy}
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
  orgId: PropTypes.string.isRequired
};
