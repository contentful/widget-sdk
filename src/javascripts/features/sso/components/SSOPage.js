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
import SSOEnabled from 'app/OrganizationSettings/SSO/SSOEnabled';
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
  const [identityProvider, setIdentityProvider] = useState({});

  const retrieve = useCallback(async () => {
    const idp = await retrieveIdp(organization.sys.id);
    setIdentityProvider({ data: idp });
    return;
  }, [organization.sys.id]);

  useEffect(() => {
    retrieve();
  }, [retrieve]);

  const handleCreateIdp = () => {
    createIdp(organization.sys.id);
  };

  const trackSupportClick = () => {
    track('sso:contact_support');
  };

  const idpData = _.get(identityProvider, ['data'], false);
  const isEnabled = _.get(idpData, ['enabled'], false);
  const restrictedModeEnabled = _.get(idpData, ['restrictedMode'], false);

  return (
    <Workbench className="sso-setup">
      <Workbench.Header
        icon={<NavigationIcon icon="Sso" size="large" />}
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
            </React.Fragment>
          )}
          {!identityProvider.data && (
            <Button
              buttonType="primary"
              isFullWidth={false}
              testId="create-idp"
              onClick={handleCreateIdp}>
              Set up SSO
            </Button>
          )}
          {idpData && !isEnabled && (
            <IDPSetupForm
              organization={organization}
              identityProvider={identityProvider}
              onUpdate={retrieve}
            />
          )}
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

SSOPage.propTypes = {
  organization: OrganizationPropType,
};
