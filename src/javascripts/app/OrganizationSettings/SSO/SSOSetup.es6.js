import React from 'react';
import Workbench from 'app/common/Workbench.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  Organization as OrganizationPropType,
  IdentityProvider as IdentityProviderPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import {
  Button,
  Notification,
  Note,
  TextLink,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';
import IDPSetupForm from './IDPSetupForm.es6';

export default class SSOSetup extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderPropType
  };

  state = {
    identityProvider: null,
    createIdp: false
  };

  componentDidMount() {
    const { identityProvider } = this.props;

    this.setState({
      identityProvider
    });
  }

  createIdp = async () => {
    const {
      organization: {
        sys: { id: orgId }
      }
    } = this.props;

    const endpoint = createOrganizationEndpoint(orgId);

    this.setState({
      creatingIdp: true
    });

    let identityProvider;

    try {
      identityProvider = await endpoint({
        method: 'POST',
        path: ['identity_provider'],
        data: {
          ssoName: ''
        }
      });
    } catch (e) {
      this.setState({
        creatingIdp: false
      });

      Notification.error(`Could not start setting up SSO`);

      return;
    }

    this.setState({
      identityProvider,
      creatingIdp: false
    });
  };

  render() {
    const { organization } = this.props;
    const { identityProvider, creatingIdp } = this.state;

    return (
      <Workbench className="sso-setup">
        <Workbench.Header>
          <Workbench.Title>Single Sign-On (SSO)</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <div className="sso-setup__main">
            <div>
              <Heading element="h1" extraClassNames="f36-margin-bottom--m f36-margin-top--2xl">
                Set up Single Sign-On (SSO) SAML 2.0
              </Heading>
              <Paragraph extraClassNames="f36-line-height--default f36-margin-bottom--2xl">
                Set up SSO for your organization in Contentful in a few steps.{'&nbsp;&nbsp;'}
                <TextLink href="https://www.contentful.com/faq/sso/">Check out the FAQs</TextLink>
                {'&nbsp;&nbsp;'}
                <TextLink href="https://www.contentful.com/support/">Talk to support</TextLink>
              </Paragraph>
              {!identityProvider && (
                <Button
                  buttonType="primary"
                  testId="create-idp"
                  loading={creatingIdp}
                  onClick={this.createIdp}>
                  Set up SSO
                </Button>
              )}
              {identityProvider && !identityProvider.enabled && (
                <IDPSetupForm organization={organization} identityProvider={identityProvider} />
              )}
              {identityProvider && identityProvider.enabled && (
                <Note noteType="positive" title="SSO is enabled">
                  SSO is enabled for your organization. Contact support to make any changes.
                </Note>
              )}
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
