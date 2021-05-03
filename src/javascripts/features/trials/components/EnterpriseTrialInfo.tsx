import React from 'react';
import {
  Card,
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
    paddingLeft: tokens.spacingM,
    '& li': { listStyleType: 'disc' },
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
    <Card testId="platform-trial-info" padding="large">
      <Typography>
        <Heading>Trial resources</Heading>
        <List className={styles.list}>
          <ListItem>
            Start with{' '}
            <TextLink
              href={contentful123Link}
              onClick={trackHelpLinkClick(contentful123Link)}
              rel="noopener noreferrer"
              target="_blank">
              Contentful 1-2-3
            </TextLink>
          </ListItem>
          <ListItem>
            Continue learning through courses in our{' '}
            <TextLink
              href={learningCenterLink}
              onClick={trackHelpLinkClick(learningCenterLink)}
              rel="noopener noreferrer"
              target="_blank">
              learning center
            </TextLink>
          </ListItem>
          <ListItem>
            Get tips and advice from our articles in the{' '}
            <TextLink
              href={helpCenterLink}
              onClick={trackHelpLinkClick(helpCenterLink)}
              rel="noopener noreferrer"
              target="_blank">
              help center
            </TextLink>
          </ListItem>
          <ListItem>
            Access developer content in our{' '}
            <TextLink
              href={developerDocsLink}
              onClick={trackHelpLinkClick(developerDocsLink)}
              rel="noopener noreferrer"
              target="_blank">
              developer documentation
            </TextLink>
          </ListItem>
        </List>
      </Typography>
    </Card>
  );
};
