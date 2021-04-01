import React from 'react';
import {
  Heading,
  List,
  ListItem,
  TextLink,
  Typography,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { developerDocsUrl, helpCenterUrl, websiteUrl } from 'Config';
import { EVENTS, trackEvent, withInAppHelpUtmParamsSubscription } from '../utils/analyticsTracking';

const styles = {
  list: css({
    color: tokens.colorTextMid,
  }),
  listItem: css({
    listStyleType: 'disc',
    marginLeft: tokens.spacingL,
  }),
};

const trackHelpLinkClick = (href: string) => () => trackEvent(EVENTS.HELP_LINK, { href });

export const EnterpriseTrialInfo = () => {
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
            onClick={trackHelpLinkClick(contentful123Link)}
            rel="noopener noreferrer"
            target="_blank">
            Contentful 1-2-3
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          Contentful{' '}
          <TextLink
            href={learningCenterLink}
            onClick={trackHelpLinkClick(learningCenterLink)}
            rel="noopener noreferrer"
            target="_blank">
            Learning Center
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          <TextLink
            href={helpCenterLink}
            onClick={trackHelpLinkClick(helpCenterLink)}
            rel="noopener noreferrer"
            target="_blank">
            Help center
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          <TextLink
            href={developerDocsLink}
            onClick={trackHelpLinkClick(developerDocsLink)}
            rel="noopener noreferrer"
            target="_blank">
            Developer portal
          </TextLink>
        </ListItem>
      </List>
    </Typography>
  );
};
