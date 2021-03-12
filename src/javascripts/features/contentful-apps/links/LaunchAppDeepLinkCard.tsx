import React from 'react';
import { cx } from 'emotion';
import { Paragraph } from '@contentful/forma-36-react-components';

import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getLaunchAppDeepLink } from '../utils/getLaunchAppDeepLink';
import { styles } from '../styles/LaunchAppDeepLinkCard.styles';
import { IfAppInstalled } from '../wrappers/ContentfulAppWrapper';
import { LaunchAppDeepLinkRaw } from './LaunchAppDeepLinkRaw';

type LaunchAppDeepLinkCardProps = {
  className?: string;
  eventOrigin: string;
};

const LaunchAppDeepLinkCard = ({ className, eventOrigin }: LaunchAppDeepLinkCardProps) => {
  const { currentSpaceId, currentEnvironmentId, currentEnvironmentAliasId } = useSpaceEnvContext();

  const deepLink = getLaunchAppDeepLink(
    currentSpaceId as string,
    currentEnvironmentAliasId || currentEnvironmentId
  );

  return (
    <IfAppInstalled appId="launch">
      <div className={cx(className, styles.noteWrapper)} data-test-id="launch-app-deep-link">
        <div className={styles.pill}>New</div>
        <Paragraph>
          Plan and schedule releases in the new Contentful{' '}
          <LaunchAppDeepLinkRaw
            href={deepLink}
            eventOrigin={eventOrigin}
            className={styles.textLink}
            externalIconColor="muted"
            withExternalIcon>
            Launch
          </LaunchAppDeepLinkRaw>
        </Paragraph>
      </div>
    </IfAppInstalled>
  );
};

export { LaunchAppDeepLinkCard };
