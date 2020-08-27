import React, { useEffect, useState, useCallback } from 'react';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import {
  Button,
  TextLink,
  Heading,
  Paragraph,
  Workbench,
} from '@contentful/forma-36-react-components';
import { IDPSetupForm } from './IDPSetupForm';
import { SSOEnabled } from './SSOEnabled';
import { track } from 'analytics/Analytics';
import _ from 'lodash';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { createIdp, retrieveIdp } from 'features/sso/services/SSOService';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'sso-setup',
  campaign: 'in-app-help',
});

const styles = {
  heading: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacing2Xl,
  }),
  setupParagraph: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

export function SSOPage({ organization }) {
  const [identityProvider, setIdentityProvider] = useState(null);
  const [idpLoading, setIdpLoading] = useState(false);
  const [loadingState, setLoadingState] = useState(false);

  const retrieve = useCallback(async () => {
    setLoadingState(true);
    const idp = await retrieveIdp(organization.sys.id);
    setIdentityProvider(idp);
    setLoadingState(false);
    return;
  }, [organization.sys.id]);

  useEffect(() => {
    retrieve();
  }, [retrieve]);

  const handleCreateIdp = () => {
    setIdpLoading(true);
    const data = createIdp(organization.sys.id);
    setIdentityProvider({ data });
    setIdpLoading(false);
  };

  const trackSupportClick = () => {
    track('sso:contact_support');
  };

  const isEnabled = identityProvider?.enabled ?? false;
  const restrictedModeEnabled = identityProvider?.restrictedMode ?? false;

  return (
    <Workbench className="sso-setup">
      <Workbench.Header
        icon={<NavigationIcon icon="Sso" size="large" />}
        title="Single Sign-On (SSO)"
      />
      <Workbench.Content>
        <div className="sso-setup__main">
          {!isEnabled && !loadingState && !identityProvider && (
            <React.Fragment>
              <Heading element="h1" className={styles.heading}>
                Set up Single Sign-On (SSO) SAML 2.0
              </Heading>
              <Paragraph className={styles.setupParagraph}>
                Set up SSO for your organization in Contentful in a few steps.&nbsp;&nbsp;
                <TextLink href={withInAppHelpUtmParams('https://www.contentful.com/faq/sso/')}>
                  Check out the FAQs
                </TextLink>
                &nbsp;&nbsp;
                <TextLink
                  onClick={trackSupportClick}
                  testId="support-link"
                  href={withInAppHelpUtmParams('https://www.contentful.com/support/')}>
                  Talk to support
                </TextLink>
              </Paragraph>
              <Button
                buttonType="primary"
                isFullWidth={false}
                testId="create-idp"
                loading={idpLoading}
                onClick={handleCreateIdp}>
                Set up SSO
              </Button>
            </React.Fragment>
          )}
          {identityProvider && !isEnabled && (
            <IDPSetupForm
              organization={organization}
              identityProvider={identityProvider}
              onUpdate={retrieve}
              onTrackSupportClick={trackSupportClick}
            />
          )}
          {identityProvider && isEnabled && (
            <SSOEnabled
              orgId={organization.sys.id}
              ssoName={identityProvider.ssoName}
              restrictedModeEnabled={restrictedModeEnabled}
              onTrackSupportClick={trackSupportClick}
            />
          )}
        </div>
      </Workbench.Content>
    </Workbench>
  );
}

SSOPage.propTypes = {
  organization: OrganizationPropType,
};
