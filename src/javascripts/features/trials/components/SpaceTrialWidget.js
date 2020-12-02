import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Card,
  ListItem,
  List,
  Paragraph,
  Subheading,
  Typography,
  TextLink,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import SpaceTrialIllustration from 'svg/illustrations/space-trial-illustration.svg';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { useAsync } from 'core/hooks';
import { isSpaceOnTrial } from '../services/TrialService';
import { getSpace } from 'services/TokenStore';
import { track } from 'analytics/Analytics';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { websiteUrl, helpCenterUrl, developerDocsUrl } from 'Config';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'trial-space-home',
  campaign: 'in-app-help',
});

const styles = {
  flexContainer: css({
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  }),
  svgContainerExtension: css({ width: '300px' }),
  list: css({
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
  }),
  listItem: css({
    listStyleType: 'disc',
    marginLeft: tokens.spacingL,
  }),
};

const trackClickEvent = (eventName) => {
  track(`trial:${eventName}`);
};

const FairUsePolicyLink = () => (
  <TextLink
    href="https://www.contentful.com/r/knowledgebase/fair-use/#trial-space-limited-use-case"
    target="_blank"
    onClick={() => trackClickEvent('fair_use_policy_clicked')}
    data-test-id="fair_use_policy_link"
    rel="noopener noreferrer"
    className={styles.learnMoreLink}>
    fair use policy
  </TextLink>
);

export const SpaceTrialWidget = ({ spaceId }) => {
  const [isTrialSpace, setIsTrialSpace] = useState(false);

  const fetchSpace = useCallback(async () => {
    getSpace(spaceId).then((space) => setIsTrialSpace(isSpaceOnTrial(space)));
  }, [spaceId]);

  const { isLoading } = useAsync(fetchSpace);

  if (isLoading || !isTrialSpace) {
    return null;
  }

  return (
    <Card padding="large" className={styles.flexContainer} testId="space-trial-widget">
      <Typography>
        <Heading>Whatʼs a trial space?</Heading>
        <List className={styles.list}>
          <ListItem className={styles.listItem}>
            A Trial Space is a sandbox to try out new projects, free of charge
          </ListItem>
          <ListItem className={styles.listItem}>You can access it for a limited time</ListItem>
          <ListItem className={styles.listItem}>
            Trial spaces are intended for non-production development and testing purposes only
          </ListItem>
        </List>
        <Subheading>Need more help to get started with Contentful?</Subheading>
        <Paragraph>
          Check out{' '}
          <TextLink
            href={withInAppHelpUtmParams(
              websiteUrl('/resources/contentful-1-2-3-program-sign-up/')
            )}
            rel="noopener noreferrer"
            target="_blank">
            Contentful 1-2-3
          </TextLink>
          , the Contentful{' '}
          <TextLink
            href={withInAppHelpUtmParams('https://public.learningcenter.contentful.com/index/')}
            rel="noopener noreferrer"
            target="_blank">
            Learning Center
          </TextLink>
          , our{' '}
          <TextLink
            href={withInAppHelpUtmParams(helpCenterUrl)}
            rel="noopener noreferrer"
            target="_blank">
            help center
          </TextLink>{' '}
          or our{' '}
          <TextLink
            href={withInAppHelpUtmParams(`${developerDocsUrl}/`)}
            rel="noopener noreferrer"
            target="_blank">
            developer portal
          </TextLink>
          .
        </Paragraph>
        <Paragraph>
          Got questions?{' '}
          <ContactUsButton noIcon isLink onClick={() => trackClickEvent('get_in_touch_clicked')}>
            Get in touch
          </ContactUsButton>{' '}
          or check our <FairUsePolicyLink />
        </Paragraph>
      </Typography>
      <div>
        <SpaceTrialIllustration className={styles.svgContainerExtension} />
      </div>
    </Card>
  );
};

SpaceTrialWidget.propTypes = {
  spaceId: PropTypes.string.isRequired,
};
