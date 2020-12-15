import React from 'react';
import {
  Heading,
  Note,
  Paragraph,
  TextLink,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { websiteUrl } from 'Config';
import StateLink from 'app/common/StateLink';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

import { styles } from './styles';

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

const withInAppHelpUtmParamsPricing = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'pricing-info',
  campaign: 'in-app-help',
});

const Header = () => <Heading>Apps</Heading>;

const PricingInfo = () => (
  <Note
    className={styles.pricingInfo}
    noteType="warning"
    title="Upgrade to our new pricing model to access this feature"
    testId="apps-pricing-info">
    <Paragraph>
      To access this feature, you need to move to the latest version of Spaces. Submit a{' '}
      <TextLink
        href={withInAppHelpUtmParamsPricing(websiteUrl('/support/?upgrade-pricing=true'))}
        {...externalLinkProps}>
        support request
      </TextLink>{' '}
      to get started, or learn more about our{' '}
      <TextLink
        href={withInAppHelpUtmParamsPricing(
          websiteUrl(
            '/pricing/?faq_category=payments-subscriptions&faq=what-type-of-spaces-can-i-have'
          )
        )}
        {...externalLinkProps}>
        Space types and pricing
      </TextLink>
      .
    </Paragraph>
  </Note>
);

export const AppsListShell = (props: AppsListShellProps) => (
  <Workbench className={styles.workbench}>
    <Workbench.Header
      title={<Header />}
      icon={<ProductIcon icon="Apps" size="large" />}
      actions={
        <StateLink path="account.organizations.apps.list" params={{ orgId: props.organizationId }}>
          Manage private apps
        </StateLink>
      }
    />
    <Workbench.Content type="text">
      {props.appsFeatureDisabled && <PricingInfo />}
      {props.appsFeatureDisabled && (
        <div className={styles.overlay} data-test-id="disabled-beta-apps" />
      )}
      <div>{props.children}</div>
    </Workbench.Content>
  </Workbench>
);

interface AppsListShellProps {
  appsFeatureDisabled?: boolean;
  organizationId: string;
  children: React.ReactElement;
}
