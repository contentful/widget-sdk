import React from 'react';
import { css } from 'emotion';
import UserProvisioningUpsellImage from 'svg/upsell-state-user-provisioning.svg';
import {
  Heading,
  Typography,
  Paragraph,
  Button,
  Workbench
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { salesUrl } from 'Config';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';

const styles = {
  pageWrapper: css({ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }),
  topMargin: css({ marginTop: tokens.spacingL })
};

function UserProvisioningUpsellState() {
  return (
    <Workbench>
      <Workbench.Header
        icon={<NavigationIcon icon="sso" size="large" color="green" />}
        title="User Provisioning"
      />
      <Workbench.Content type="text">
        <div className={styles.pageWrapper}>
          <EmptyStateContainer>
            <div className={defaultSVGStyle}>
              <UserProvisioningUpsellImage />
            </div>
            <Typography>
              <Heading>Provision users in Contentful using your identity provider</Heading>
              <Paragraph>
                You can manage users and teams within your organization in Contentful directly from
                your identity provider. We support SCIM 2.0 for user provisioning.{' '}
                {/* TODO uncomment when page is available
                <TextLink
                  href="https://www.contentful.com/faq/SSO-Groups-Provisioning/
                  "
                  target="_blank">
                  Read our FAQs for more information.
                </TextLink> */}
              </Paragraph>
              <Paragraph>
                The user provisioning feature is available on selected enterprise-grade platform
                plans. To add user provisioning to your plan, contact us directly.
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

export default UserProvisioningUpsellState;
