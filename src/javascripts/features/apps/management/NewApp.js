import {
  Button,
  Note,
  Notification,
  Paragraph,
  TextLink,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import DocumentTitle from 'components/shared/DocumentTitle';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import React from 'react';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { AppEditor, validate } from './AppEditor';
import { ManagementApiClient } from './ManagementApiClient';

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

export class NewApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      definition: ManagementApiClient.createDefinitionTemplateForOrg(props.orgId),
      errors: [],
    };
  }

  save = async () => {
    const errors = validate(this.state.definition, []);
    if (errors.length > 0) {
      this.setState({ errors });
      return;
    }

    this.setState({ busy: true });

    try {
      const saved = await ManagementApiClient.save(this.state.definition);
      Notification.success('App created successfully.');
      this.props.goToDefinition(saved.sys.id);
    } catch (err) {
      if (err.status === 422) {
        this.setState({
          errors: err.data.details.errors.map((error) => {
            if (error.path[0] === 'locations' && typeof error.path[1] === 'number') {
              error.path[1] = this.state.definition.locations[error.path[1]].location;
            }
            return error;
          }),
        });
        Notification.error(ManagementApiClient.VALIDATION_MESSAGE);
      } else {
        Notification.error("Something went wrong. Couldn't create app.");
      }
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
          icon={<ProductIcon icon="Apps" size="large" />}
          actions={
            <div className="workbench-header__actions">
              <Button
                loading={busy}
                disabled={busy}
                buttonType="positive"
                onClick={this.save}
                testId="app-create">
                Create
              </Button>
            </div>
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

          <AppEditor
            definition={definition}
            onChange={(definition) => this.setState({ definition })}
            errors={this.state.errors}
            onErrorsChange={(errors) => this.setState({ errors })}
            disabled={busy}
          />
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
