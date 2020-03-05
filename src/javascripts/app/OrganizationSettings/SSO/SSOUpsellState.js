import React from 'react';
import { css } from 'emotion';
import SSOUpsellStateImage from 'svg/upsell-state-sso.svg';
import {
  Heading,
  Typography,
  Paragraph,
  TextLink,
  Button,
  Workbench
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { salesUrl, apiUrl } from 'Config';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import NavigationIcon from 'ui/Components/NavigationIcon';

const styles = {
  pageWrapper: css({ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }),
  topMargin: css({ marginTop: tokens.spacingL })
};

function SSOUpsellState() {
  return (
    <Workbench className="sso-setup">
      <Workbench.Header
        icon={<NavigationIcon icon="sso" size="large" color="green" />}
        title="Single Sign-On (SSO)"
      />
      <Workbench.Content>
        <div className={styles.pageWrapper}>
          <EmptyStateContainer>
            <div className={defaultSVGStyle}>
              <SSOUpsellStateImage />
            </div>
            <Typography>
              <Heading>Authorize users in Contentful using your identity provider</Heading>
              <Paragraph>
                You can authorize users within your organization in Contentful directly from your
                identity provider. We support SAML 2.0 for user authorization.{' '}
                <TextLink href={`https:${apiUrl('faq/sso/')}`} target="_blank">
                  Read our FAQs for more information.
                </TextLink>
              </Paragraph>
              <Paragraph>
                The single sign-on feature is available only on enterprise-grade platform plans. To
                add single sign-on to your plan, contact us directly.
              </Paragraph>
            </Typography>
            <Button
              testId="get-in-touch-btn"
              className={styles.topMargin}
              href={salesUrl}
              target="_blank">
              Get in touch
            </Button>
          </EmptyStateContainer>
        </div>
      </Workbench.Content>
    </Workbench>
  );
}

export default SSOUpsellState;
