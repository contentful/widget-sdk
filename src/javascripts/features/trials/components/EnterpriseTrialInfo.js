import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  List,
  ListItem,
  TextLink,
  Typography,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { isOrganizationOnTrial } from '../services/TrialService';
import { developerDocsUrl, helpCenterUrl, websiteUrl } from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  list: css({
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
  }),
  listItem: css({
    listStyleType: 'disc',
    marginLeft: tokens.spacingL,
  }),
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'subscription-enterprise-trial',
  campaign: 'in-app-help',
});

export const EnterpriseTrialInfo = ({ organization }) => {
  if (!isOrganizationOnTrial(organization)) {
    return null;
  }

  return (
    <Typography testId="platform-trial-info">
      <Heading className="section-title">Trial resources</Heading>
      <List className={styles.list}>
        <ListItem className={styles.listItem}>
          First steps{' '}
          <TextLink
            href={withInAppHelpUtmParams(
              websiteUrl('/resources/contentful-1-2-3-program-sign-up/')
            )}
            rel="noopener noreferrer"
            target="_blank">
            Contentful 1-2-3
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          Contentful{' '}
          <TextLink
            href={withInAppHelpUtmParams('https://public.learningcenter.contentful.com/index/')}
            rel="noopener noreferrer"
            target="_blank">
            Learning Center
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          <TextLink
            href={withInAppHelpUtmParams(helpCenterUrl)}
            rel="noopener noreferrer"
            target="_blank">
            Help center
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          <TextLink
            href={withInAppHelpUtmParams(`${developerDocsUrl}/`)}
            rel="noopener noreferrer"
            target="_blank">
            Developer portal
          </TextLink>
        </ListItem>
      </List>
    </Typography>
  );
};

EnterpriseTrialInfo.propTypes = {
  organization: PropTypes.object.isRequired,
};
