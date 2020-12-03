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
import { EVENTS, trackEvent, withInAppHelpUtmParamsSubscription } from '../utils/analyticsTracking';

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

export const EnterpriseTrialInfo = ({ organization }) => {
  if (!isOrganizationOnTrial(organization)) {
    return null;
  }

  const learningCenterLink = withInAppHelpUtmParamsSubscription(
    'https://public.learningcenter.contentful.com/index/'
  );
  const helpCenterLink = withInAppHelpUtmParamsSubscription(helpCenterUrl);
  const developerDocsLink = withInAppHelpUtmParamsSubscription(`${developerDocsUrl}/`);
  const contentful123Link = withInAppHelpUtmParamsSubscription(
    websiteUrl('/resources/contentful-1-2-3-program-sign-up/')
  );

  return (
    <Typography testId="platform-trial-info">
      <Heading className="section-title">Trial resources</Heading>
      <List className={styles.list}>
        <ListItem className={styles.listItem}>
          First steps{' '}
          <TextLink
            href={contentful123Link}
            onClick={trackEvent(EVENTS.HELP_LINK, { href: contentful123Link })}
            rel="noopener noreferrer"
            target="_blank">
            Contentful 1-2-3
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          Contentful{' '}
          <TextLink
            href={learningCenterLink}
            onClick={trackEvent(EVENTS.HELP_LINK, { href: learningCenterLink })}
            rel="noopener noreferrer"
            target="_blank">
            Learning Center
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          <TextLink
            href={helpCenterLink}
            onClick={trackEvent(EVENTS.HELP_LINK, { href: helpCenterLink })}
            rel="noopener noreferrer"
            target="_blank">
            Help center
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          <TextLink
            href={developerDocsLink}
            onClick={trackEvent(EVENTS.HELP_LINK, { href: developerDocsLink })}
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
