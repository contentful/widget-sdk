import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { IdentityProviderStatePropType } from './PropTypes.es6';
import { Button, TextLink, Heading, Paragraph } from '@contentful/forma-36-react-components';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import IDPSetupForm from './IDPSetupForm.es6';
import SSOEnabled from './SSOEnabled.es6';
import * as ssoActionCreators from 'redux/actions/sso/actionCreators.es6';
import * as ssoSelectors from 'redux/selectors/sso.es6';
import getOrganizationSelector from 'redux/selectors/getOrganization.es6';
import _ from 'lodash';

import { connect } from 'react-redux';

export class SSOSetup extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderStatePropType,
    retrieveIdp: PropTypes.func.isRequired,
    createIdp: PropTypes.func.isRequired,
    onReady: PropTypes.func.isRequired
  };

  componentDidMount() {
    const { organization } = this.props;

    if (organization) {
      this.retrieve();
    }
  }

  componentDidUpdate(prevProps) {
    const { organization } = this.props;

    // Getting the org is asynchronous, so we wait until there is an org available
    // before making the retrieveIdp call
    if (!prevProps.organization && organization) {
      this.retrieve();
    }
  }

  retrieve = () => {
    const { retrieveIdp, organization, onReady } = this.props;

    // Both create and get identity provider actions return `isPending`
    // to denote the pending state, and it is handled the same when
    // rendered.
    //
    // Since the component will never be rendered without the idP
    // state populated in Redux, there will never be a case when that
    // we could run into an ambiguous pending state.
    retrieveIdp({ orgId: organization.sys.id }).then(onReady);
  };

  createIdp = () => {
    const { createIdp, organization } = this.props;

    createIdp({ orgId: organization.sys.id, orgName: organization.name });
  };

  render() {
    const { identityProvider, organization } = this.props;

    if (!organization) {
      return <FetcherLoading message="Loading SSO..." />;
    }

    if (!identityProvider) {
      return null;
    }

    const idpData = _.get(identityProvider, ['data'], null);
    const isEnabled = _.get(idpData, ['enabled'], false);
    const restrictedModeEnabled = _.get(idpData, ['restricted'], false);

    return (
      <Workbench className="sso-setup">
        <Workbench.Header>
          <Workbench.Icon icon="page-sso" />
          <Workbench.Title>Single Sign-On (SSO)</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <div className="sso-setup__main">
            {!isEnabled && (
              <React.Fragment>
                <Heading element="h1" extraClassNames="f36-margin-bottom--m f36-margin-top--2xl">
                  Set up Single Sign-On (SSO) SAML 2.0
                </Heading>
                <Paragraph extraClassNames="f36-line-height--default f36-margin-bottom--2xl">
                  Set up SSO for your organization in Contentful in a few steps.&nbsp;&nbsp;
                  <TextLink href="https://www.contentful.com/faq/sso/">Check out the FAQs</TextLink>
                  &nbsp;&nbsp;
                  <TextLink href="https://www.contentful.com/support/">Talk to support</TextLink>
                </Paragraph>
              </React.Fragment>
            )}
            {!identityProvider.data && (
              <Button
                buttonType="primary"
                isFullWidth={false}
                testId="create-idp"
                loading={identityProvider.isPending}
                onClick={this.createIdp}>
                Set up SSO
              </Button>
            )}
            {idpData && !isEnabled && <IDPSetupForm organization={organization} />}
            {idpData && isEnabled && (
              <SSOEnabled
                organization={organization}
                ssoName={idpData.ssoName}
                restrictedModeEnabled={restrictedModeEnabled}
              />
            )}
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default connect(
  state => {
    return {
      organization: getOrganizationSelector(state),
      identityProvider: ssoSelectors.getIdentityProvider(state)
    };
  },
  {
    retrieveIdp: ssoActionCreators.retrieveIdp,
    createIdp: ssoActionCreators.createIdp
  }
)(SSOSetup);
