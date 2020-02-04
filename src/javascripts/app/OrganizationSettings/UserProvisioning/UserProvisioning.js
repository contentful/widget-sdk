import React from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import {
  TextLink,
  TextInput,
  Heading,
  Paragraph,
  Note,
  Button
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  content: css({
    width: '700px',
    display: 'flex',
    margin: '0 280px',
    fontFmily: 'Avenir Next',
    lineHeight: '21px',
    fontSize: tokens.fontSizeM
  }),
  heading: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacing2Xl
  }),
  subheading: css({
    height: '21px',
    width: '161px',
    color: '#2A3039',
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacinXs,
    marginTop: tokens.spacingL
  }),
  paragraph: css({
    color: '#536171',
    marginBottom: tokens.spacingM
  })
};

const UserProvisioning = ({ orgId, onReady }) => {
  onReady();

  return (
    <OrgAdminOnly orgId={orgId}>
      <Workbench>
        <Workbench.Header icon={<Icon name="page-sso" scale="0.75" />} title="User Provisoning" />
        <Workbench.Content className={styles.content}>
          <div className="setup-main">
            <Heading element="h1" className={styles.heading}>
              Set up user provisioning with SCIM 2.0
            </Heading>
            <Paragraph className={styles.paragraph}>
              Set up user provisioning for your organization in Contentful in a few
              steps.&nbsp;&nbsp;
              <TextLink href="https://www.contentful.com/faq/">Check out the FAQs.</TextLink>
            </Paragraph>
            <Note noteType="primary">
              We strongly recommend using a service account for setting up user provisioning to
              better manage the organization access in Contentful.&nbsp;&nbsp;
              <TextLink>Show more</TextLink>
            </Note>
          </div>
          <div className="configuration-details">
            <Heading element="h1" className={styles.heading}>
              SCIM configuration details
            </Heading>
            <TextInput
              name="scim-url"
              testId="scim-url"
              disabled
              withCopyButton
              value="https://app.contentful.com"
            />
            <div className={styles.subheading}>Personal Access Token</div>
            <Paragraph className={styles.paragraph}>
              As an alternative to OAuth applications, you can also leverage Personal Access Tokens
              to use the Content Management API. These tokens are always bound to your individual
              account, with the same permissions you have on all of your spaces and organizations.
            </Paragraph>
            <Button>Generate personal access token</Button>
          </div>
        </Workbench.Content>
      </Workbench>
    </OrgAdminOnly>
  );
};

UserProvisioning.propTypes = {
  orgId: PropTypes.string.isRequired,
  onReady: PropTypes.func.isRequired
};
