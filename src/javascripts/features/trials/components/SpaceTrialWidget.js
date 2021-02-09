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
import moment from 'moment';
import SpaceTrialIllustration from 'svg/illustrations/space-trial-illustration.svg';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { useAsync } from 'core/hooks';
import { isSpaceOnTrial } from '../services/TrialService';
import { getSpace } from 'services/TokenStore';
import { websiteUrl, helpCenterUrl, developerDocsUrl } from 'Config';
import { trackEvent, EVENTS, withInAppHelpUtmParamsSpaceHome } from '../utils/analyticsTracking';

const styles = {
  flexContainer: css({
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  }),
  svgContainerExtension: css({ width: '300px' }),
  list: css({
    marginBottom: tokens.spacingL,
    color: tokens.colorTextMid,
  }),
  listItem: css({
    listStyleType: 'disc',
    marginLeft: tokens.spacingL,
  }),
};

const FairUsePolicyLink = () => (
  <TextLink
    href="https://www.contentful.com/r/knowledgebase/fair-use/#trial-space-limited-use-case"
    target="_blank"
    onClick={trackEvent(EVENTS.FAIR_USAGE_POLICY)}
    data-test-id="fair_use_policy_link"
    rel="noopener noreferrer"
    className={styles.learnMoreLink}>
    fair use policy
  </TextLink>
);

export const SpaceTrialWidget = ({ spaceId, hasActiveAppTrial = false }) => {
  const [isTrialSpace, setIsTrialSpace] = useState(false);
  const [trialExpiresAt, setTrialExpiresAt] = useState();

  const fetchSpace = useCallback(async () => {
    await getSpace(spaceId).then((space) => {
      setIsTrialSpace(isSpaceOnTrial(space));
      setTrialExpiresAt(space.trialPeriodEndsAt);
    });
  }, [spaceId]);

  const { isLoading } = useAsync(fetchSpace);
  if (isLoading || !isTrialSpace || hasActiveAppTrial) {
    return null;
  }

  const learningCenterLink = withInAppHelpUtmParamsSpaceHome(
    'https://public.learningcenter.contentful.com/index/'
  );
  const helpCenterLink = withInAppHelpUtmParamsSpaceHome(helpCenterUrl);
  const developerDocsLink = withInAppHelpUtmParamsSpaceHome(`${developerDocsUrl}/`);
  const contentful123Link = withInAppHelpUtmParamsSpaceHome(
    websiteUrl('/resources/contentful-1-2-3-program-sign-up/')
  );

  return (
    <Card padding="large" className={styles.flexContainer} testId="space-trial-widget">
      <Typography>
        <Heading>Whatʼs a Trial Space?</Heading>
        <List className={styles.list}>
          <ListItem className={styles.listItem}>Here to try out any new project</ListItem>
          <ListItem className={styles.listItem}>
            Intended for non-production development and testing purposes only
          </ListItem>
          <ListItem className={styles.listItem}>
            Available until <strong>{moment(trialExpiresAt).format('D MMMM YYYY')}</strong>
            {` (Want to keep it after and push to production? No problem, talk to your admin to buy a subscription)`}
          </ListItem>
        </List>
        <Subheading>Need more help to get started with Contentful?</Subheading>
        <Paragraph>
          Check out{' '}
          <TextLink
            href={contentful123Link}
            onClick={trackEvent(EVENTS.HELP_LINK, { href: contentful123Link })}
            rel="noopener noreferrer"
            target="_blank">
            Contentful 1-2-3
          </TextLink>
          , the Contentful{' '}
          <TextLink
            href={learningCenterLink}
            rel="noopener noreferrer"
            onClick={trackEvent(EVENTS.HELP_LINK, { href: learningCenterLink })}
            target="_blank">
            Learning Center
          </TextLink>
          , our{' '}
          <TextLink
            href={helpCenterLink}
            rel="noopener noreferrer"
            onClick={trackEvent(EVENTS.HELP_LINK, { href: helpCenterLink })}
            target="_blank">
            help center
          </TextLink>{' '}
          or our{' '}
          <TextLink
            href={developerDocsLink}
            onClick={trackEvent(EVENTS.HELP_LINK, { href: developerDocsLink })}
            rel="noopener noreferrer"
            target="_blank">
            developer portal
          </TextLink>
          .
        </Paragraph>
        <Paragraph>
          Got questions?{' '}
          <ContactUsButton noIcon isLink onClick={trackEvent(EVENTS.GET_IN_TOUCH)}>
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
  hasActiveAppTrial: PropTypes.bool,
};
