import React from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { TextLink, Heading, Paragraph, Note } from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  heading: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacing2Xl
  }),
  setupParagraph: css({
    marginBottom: tokens.spacingL
  })
};

const UserProvisioning = ({ onReady }) => {
  onReady();

  return (
    <Workbench className="scim-setup">
      <Workbench.Header icon={<Icon name="page-sso" scale="0.75" />} title="User Provisoning" />
      <Workbench.Content>
        <div className="scim-setup__main">
          <Heading element="h1" className={styles.heading} testId="scim-header">
            Set up user provisioning with SCIM 2.0
          </Heading>
          <Paragraph className={styles.setupParagraph}>
            Set up user provisioning for your organization in Contentful in a few steps.&nbsp;&nbsp;
            <TextLink href="https://www.contentful.com/faq/">Check out the FAQs</TextLink>
          </Paragraph>
        </div>
        <Note noteType="primary">
          We strongly recommend using a service account for setting up user provisioning to better
          manage the organization access in Contentful.
        </Note>
      </Workbench.Content>
    </Workbench>
  );
};

UserProvisioning.propTypes = {
  onReady: PropTypes.func.isRequired
};

export default UserProvisioning;
