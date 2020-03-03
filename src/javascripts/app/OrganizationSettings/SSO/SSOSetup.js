import React from 'react';
import PropTypes from 'prop-types';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { IdentityProviderStatePropType } from './PropTypes';
import {
  Button,
  TextLink,
  Heading,
  Paragraph,
  Workbench
} from '@contentful/forma-36-react-components';
import { ACCESS_TOOLS } from 'featureFlags';
import { getVariation } from 'LaunchDarkly';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import IDPSetupForm from './IDPSetupForm';
import SSOEnabled from './SSOEnabled';
import * as ssoActionCreators from 'redux/actions/sso/actionCreators';
import * as ssoSelectors from 'redux/selectors/sso';
import getOrganizationSelector from 'redux/selectors/getOrganization';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import _ from 'lodash';

import { connect } from 'react-redux';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import SSOUpsellState from './SSOUpsellState';
import NavigationIcon from 'ui/Components/NavigationIcon';

const styles = {
  heading: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacing2Xl
  }),
  setupParagraph: css({
    marginBottom: tokens.spacing2Xl
  })
};
export class SSOSetup extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderStatePropType,
    retrieveIdp: PropTypes.func.isRequired,
    createIdp: PropTypes.func.isRequired
  };

  state = {
    isAllowed: false,
    showUpsellState: false,
    isLoading: true
  };

  componentDidMount() {
    const { organization } = this.props;

    if (organization) {
      this.initialize();
    }
  }

  componentDidUpdate(prevProps) {
    const { organization } = this.props;

    // Getting the org is asynchronous, so we wait until there is an org available
    // before making the retrieveIdp call
    if (!prevProps.organization && organization) {
      this.initialize();
    }
  }

  initialize = async () => {
    const { organization } = this.props;

    const featureEnabled = await getOrgFeature(organization.sys.id, 'self_configure_sso');
    const accessToolsEnabled = await getVariation(ACCESS_TOOLS, {
      organizationId: organization.sys.id
    });
    const hasPerms = isOwnerOrAdmin(organization);

    if (!featureEnabled || !hasPerms) {
      this.setState({
        isAllowed: false,
        showUpsellState: accessToolsEnabled,
        isLoading: false
      });

      return;
    }

    this.setState({
      isAllowed: true
    });

    this.retrieve();
  };

  retrieve = () => {
    const { retrieveIdp, organization } = this.props;

    // Both create and get identity provider actions return `isPending`
    // to denote the pending state, and it is handled the same when
    // rendered.
    //
    // Since the component will never be rendered without the idP
    // state populated in Redux, there will never be a case when that
    // we could run into an ambiguous pending state.
    retrieveIdp({ orgId: organization.sys.id }).then(() => {
      this.setState({
        isLoading: false
      });
    });
  };

  createIdp = () => {
    const { createIdp, organization } = this.props;

    createIdp({ orgId: organization.sys.id, orgName: organization.name });
  };

  trackSupportClick = () => {
    track('sso:contact_support');
  };

  render() {
    const { identityProvider, organization } = this.props;
    const { isAllowed, showUpsellState, isLoading } = this.state;

    if (!organization || isLoading) {
      return <FetcherLoading message="Loading SSO..." />;
    }

    if (!isAllowed) {
      if (showUpsellState) {
        return <SSOUpsellState />;
      }

      return <ForbiddenPage />;
    }

    if (!identityProvider) {
      return null;
    }

    const idpData = _.get(identityProvider, ['data'], null);
    const isEnabled = _.get(idpData, ['enabled'], false);
    const restrictedModeEnabled = _.get(idpData, ['restrictedMode'], false);

    return (
      <Workbench className="sso-setup">
        <Workbench.Header
          icon={<NavigationIcon icon="sso" size="large" color="green" />}
          title="Single Sign-On (SSO)"
        />
        <Workbench.Content>
          <div className="sso-setup__main">
            {!isEnabled && (
              <React.Fragment>
                <Heading element="h1" className={styles.heading}>
                  Set up Single Sign-On (SSO) SAML 2.0
                </Heading>
                <Paragraph className={styles.setupParagraph}>
                  Set up SSO for your organization in Contentful in a few steps.&nbsp;&nbsp;
                  <TextLink href="https://www.contentful.com/faq/sso/">Check out the FAQs</TextLink>
                  &nbsp;&nbsp;
                  <TextLink
                    onClick={this.trackSupportClick}
                    testId="support-link"
                    href="https://www.contentful.com/support/">
                    Talk to support
                  </TextLink>
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
