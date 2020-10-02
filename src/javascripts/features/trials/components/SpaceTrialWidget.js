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
import { getVariation, FLAGS } from 'LaunchDarkly';
import { useAsync } from 'core/hooks';
import { isSpaceOnTrial } from '../services/TrialService';
import { getSpace } from 'services/TokenStore';
import { track } from 'analytics/Analytics';

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
    listStylePosition: 'inside',
  }),
};

const trackClickEvent = (eventName) => {
  track(`trial:${eventName}`);
};

const FairUsePolicyLink = () => (
  <TextLink
    href="https://www.contentful.com/r/knowledgebase/fair-use/"
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

  const [isTrialCommEnabled, setIsTrialCommEnabled] = useState(false);

  const fetchSpace = useCallback(async () => {
    const space = await getSpace(spaceId);
    const organizationId = space.organization.sys.id;
    const isTrialCommEnabled = await getVariation(FLAGS.PLATFORM_TRIAL_COMM, { organizationId });

    if (!isTrialCommEnabled) {
      return;
    }

    setIsTrialCommEnabled(isTrialCommEnabled);

    getSpace(spaceId).then((space) => setIsTrialSpace(isSpaceOnTrial(space)));
  }, [spaceId]);

  const { isLoading } = useAsync(fetchSpace);

  if (isLoading || !isTrialSpace || !isTrialCommEnabled) {
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
            Since itʼs a sandbox, content here is not public
          </ListItem>
        </List>
        <Subheading>What happens at the end of my trial?</Subheading>
        <Paragraph>
          If you choose not to buy a subscription plan, your space will become <b>read-only</b>.
          Want to bring your space back to life? Simply buy a subscription plan and you&apos;ll be
          back to editing content in no time
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
