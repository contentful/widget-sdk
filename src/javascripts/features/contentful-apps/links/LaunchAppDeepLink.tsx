import React, { ReactNode, ReactElement, forwardRef, Ref } from 'react';

import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { getLaunchAppDeepLink } from '../utils/getLaunchAppDeepLink';
import { LaunchAppDeepLinkRaw } from './LaunchAppDeepLinkRaw';
import { IconProps } from '@contentful/forma-36-react-components/dist/components/Icon';

interface LaunchAppDeepLinkProps {
  className?: string;
  children: ReactNode;
  eventOrigin?: string;
  releaseId?: string;
  withIcon?: boolean;
  withExternalIcon?: boolean;
  externalIconColor?: IconProps['color'];
  iconSize?: number;
  forwardedRef?: Ref<HTMLAnchorElement>;
  iconPosition?: 'left' | 'right';
}

const LaunchAppDeepLink: React.FC<LaunchAppDeepLinkProps> = (
  props: LaunchAppDeepLinkProps
): ReactElement | null => {
  const {
    className,
    children,
    eventOrigin,
    releaseId,
    withIcon,
    iconSize,
    withExternalIcon,
    externalIconColor,
    iconPosition = 'left',
    forwardedRef,
  } = props;
  const { currentSpaceId, currentEnvironmentId, currentEnvironmentAliasId } = useSpaceEnvContext();

  const href = getLaunchAppDeepLink(
    currentSpaceId as string,
    currentEnvironmentAliasId || currentEnvironmentId,
    releaseId
  );

  return (
    <LaunchAppDeepLinkRaw
      className={className}
      href={href}
      eventOrigin={eventOrigin}
      withIcon={withIcon}
      iconSize={iconSize}
      withExternalIcon={withExternalIcon}
      externalIconColor={externalIconColor}
      iconPosition={iconPosition}
      ref={forwardedRef}>
      {children}
    </LaunchAppDeepLinkRaw>
  );
};

const LaunchAppDeepLinkWithRef = forwardRef(
  (props: Omit<LaunchAppDeepLinkProps, 'forwardedRef'>, ref: Ref<HTMLAnchorElement>) => {
    const { children, ...rest } = props;
    return (
      <LaunchAppDeepLink forwardedRef={ref} {...rest}>
        {children}
      </LaunchAppDeepLink>
    );
  }
);

export { LaunchAppDeepLinkWithRef as LaunchAppDeepLink };
