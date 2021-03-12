import { AppLogos } from '@contentful/experience-components';
import { Button, Flex, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { css } from 'emotion';
import React from 'react';
import { getLaunchAppDeepLink } from '../utils/getLaunchAppDeepLink';

type LaunchAppDeepLinkSplashProps = {
  releaseId: string;
  eventOrigin: string;
};

const styles = {
  section: css({
    paddingTop: 20,
  }),
  doubleMargined: css({
    marginTop: tokens.spacingL,
  }),
  margined: css({
    marginTop: tokens.spacingM,
  }),
  halfMargined: css({
    marginTop: tokens.spacingXs,
  }),
};

const LaunchAppDeepLinkSplash = ({ releaseId, eventOrigin }: LaunchAppDeepLinkSplashProps) => {
  const { currentEnvironmentId, currentEnvironmentAliasId, currentSpaceId } = useSpaceEnvContext();

  const deepLinkToLaunch = () => {
    track('launch_app:link_clicked', {
      eventOrigin,
    });
    window.open(
      getLaunchAppDeepLink(
        currentSpaceId as string,
        currentEnvironmentAliasId || currentEnvironmentId,
        releaseId
      )
    );
  };

  return (
    <Flex flexDirection="column" fullWidth fullHeight justifyContent="center">
      <Flex
        className={styles.section}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        fullWidth
        fullHeight={true}>
        <AppLogos.LaunchLogo width={210} height={175} />
        <Heading className={styles.doubleMargined}>Contentful Launch</Heading>
        <Paragraph className={styles.halfMargined}>
          You can now create and schedule releases from Launch.
        </Paragraph>
        <Button
          className={styles.doubleMargined}
          buttonType="primary"
          onClick={deepLinkToLaunch}
          icon="ExternalLinkTrimmed">
          View this release in Launch
        </Button>
      </Flex>
    </Flex>
  );
};

export { LaunchAppDeepLinkSplash };
