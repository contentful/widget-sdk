import React from 'react';
import { css } from 'emotion';
import TeamsEmptyStateImage from 'svg/add-team-illustration.svg';
import {
  Heading,
  Typography,
  Paragraph,
  TextLink,
  Button,
  Workbench,
  Icon
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
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
      <Workbench.Header icon={<Icon name="page-sso" scale="0.75" />} title="User Provisioning" />
      <Workbench.Content type="text">
        <EmptyStateContainer>
          <div className={defaultSVGStyle}>
            <TeamsEmptyStateImage />
          </div>
          <Typography>
            <Heading>Provision users in Contentful using your identity provider</Heading>
            <Paragraph>
              You can manage users and teams within your organization in Contentful directly from
              your identity provider. We support SCIM 2.0 for user provisiong.{' '}
              <TextLink href="https://www.contentful.com/faq/" target="_blank">
                Read our FAQs for more information.
              </TextLink>
            </Paragraph>
            <Paragraph>
              The user provisiong feature is available on selected Enterprise-grade platform plans.
              To add user provisioning to your plan, please contact us directly.
            </Paragraph>
          </Typography>
          <Button
            testId="get-in-touch-button"
            className={styles.topMargin}
            href={salesUrl}
            target="_blank">
            Get in touch with us
          </Button>
        </EmptyStateContainer>
      </Workbench.Content>
    </Workbench>
  );
}

export default UserProvisioningUpsellState;
