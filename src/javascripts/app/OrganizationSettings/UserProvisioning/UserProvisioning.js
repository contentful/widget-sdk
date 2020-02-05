import React, { Component } from 'react';
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
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import ForbiddenState from 'app/common/ForbiddenState';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';

const styles = {
  content: css({
    width: '700px',
    margin: '0 280px',
    fontSize: tokens.fontSizeM
  }),
  heading: css({
    fontFamily: 'Avenir Next',
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacing2Xl
  }),
  subheading: css({
    color: '#2A3039',
    lineHeight: '21px',
    fontFamily: 'Avenir Next',
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXs,
    marginTop: tokens.spacingL
  }),
  subheadingBold: css({
    color: '#2A3039',
    lineHeight: '21px',
    fontFamily: 'Avenir Next',
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXs,
    marginTop: tokens.spacingL
  }),
  paragraph: css({
    color: '#536171',
    lineHeight: '21px',
    fontFamily: 'Avenir Next',
    marginBottom: tokens.spacingM
  })
};

const FeatureFetcher = createFetcherComponent(async ({ orgId }) => {
  const featureEnabled = await getOrgFeature(orgId, 'scim');
  return [featureEnabled];
});

export default class UserProvisioning extends Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };
  componentDidMount() {
    this.props.onReady();
  }
  render() {
    const { orgId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <FeatureFetcher orgId={orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading..." />;
            }
            if (isError) {
              return <StateRedirect path="home" />;
            }
            if (data.featureEnabled) {
              return <ForbiddenState />;
            }

            return (
              <Workbench>
                <Workbench.Header
                  icon={<Icon name="page-sso" scale="0.75" />}
                  title="User Provisioning"
                />
                <Workbench.Content>
                  <div className={styles.content}>
                    <Heading element="h1" className={styles.heading} testId="scim-header">
                      Set up user provisioning with SCIM 2.0
                    </Heading>
                    <Paragraph className={styles.paragraph}>
                      Set up user provisioning for your organization in Contentful in a few
                      steps.&nbsp;&nbsp;
                      <TextLink href="https://www.contentful.com/faq/">
                        Check out the FAQs.
                      </TextLink>
                    </Paragraph>
                    <Note noteType="primary">
                      We strongly recommend using a service account for setting up user provisioning
                      to better manage the organization access in Contentful.&nbsp;&nbsp;
                      <TextLink>Show more</TextLink>
                    </Note>
                    <Heading element="h1" className={styles.heading}>
                      SCIM configuration details
                    </Heading>
                    <div className={styles.paragraph}>SCIM URL</div>
                    <TextInput
                      name="scim-url"
                      testId="scim-url"
                      disabled
                      withCopyButton
                      value="https://app.contentful.com" //TODO set dynamic base url
                    />
                    <div className={styles.subheadingBold}>Personal Access Token</div>
                    <Paragraph className={styles.paragraph}>
                      As an alternative to OAuth applications, you can also leverage Personal Access
                      Tokens to use the Content Management API. These tokens are always bound to
                      your individual account, with the same permissions you have on all of your
                      spaces and organizations.
                    </Paragraph>
                    <Button>Generate personal access token</Button>
                  </div>
                </Workbench.Content>
              </Workbench>
            );
          }}
        </FeatureFetcher>
      </OrgAdminOnly>
    );
  }
}
