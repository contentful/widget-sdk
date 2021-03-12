import React, { ReactNode, ReactElement, forwardRef, Ref } from 'react';
import { css } from 'emotion';
import { track } from 'analytics/Analytics';
import { AppLogos } from '@contentful/experience-components';
import { Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { IconProps } from '@contentful/forma-36-react-components/dist/components/Icon';

const launchLogoStyles = (iconPosition: LaunchAppDeepLinkRawProps['iconPosition']) => {
  const spacing =
    iconPosition === 'left'
      ? {
          marginRight: tokens.spacingXs,
        }
      : {
          marginLeft: tokens.spacingXs,
        };

  return css({
    ...spacing,
    verticalAlign: 'middle',
  });
};

const styles = {
  externalIcon: css({
    verticalAlign: 'text-bottom',
  }),
};

interface LaunchAppDeepLinkRawProps {
  className?: string;
  children: ReactNode;
  href: string;
  eventOrigin?: string;
  withIcon?: boolean;
  iconSize?: number;
  withExternalIcon?: boolean;
  externalIconColor?: IconProps['color'];
  forwardedRef?: Ref<HTMLAnchorElement>;
  iconPosition?: 'left' | 'right';
}

/**
  Raw because it doesn't use context
  used inside of Notification.success() and similar, where components get detached from their context provider
*/
const LaunchAppDeepLinkRaw: React.FC<LaunchAppDeepLinkRawProps> = (
  props: LaunchAppDeepLinkRawProps
): ReactElement | null => {
  const {
    className,
    children,
    href,
    eventOrigin,
    withIcon = false,
    iconSize = 24,
    withExternalIcon = false,
    externalIconColor,
    iconPosition = 'left',
    forwardedRef,
  } = props;

  // the reason why I use anchor here is because forma TextLink doesn't support refs
  // I needed refs to trigger click from parent and not have to copy paste the whole logic up just for one use case
  // If you are reading this when TextLinks support refs (v4 forma), please be a kind human and replace <a> with <TextLink>
  // TODO: replace with TextLink and apply related props like linkType and similar instead of custom classes
  return (
    // eslint-disable-next-line rulesdir/restrict-non-f36-components
    <a
      className={className}
      data-test-id="cf-ui-text-link"
      ref={forwardedRef}
      href={href}
      onClick={() =>
        track('launch_app:link_clicked', {
          eventOrigin: eventOrigin,
        })
      }
      target="_blank"
      rel="noopener noreferrer">
      {withIcon && iconPosition === 'left' ? (
        <span className={launchLogoStyles(iconPosition)}>
          <AppLogos.LaunchLogo width={iconSize} height={iconSize} />
        </span>
      ) : null}
      {children}
      {withIcon && iconPosition === 'right' ? (
        <span className={launchLogoStyles(iconPosition)}>
          <AppLogos.LaunchLogo width={iconSize} height={iconSize} />
        </span>
      ) : null}
      {withExternalIcon ? (
        <span className={launchLogoStyles('right')}>
          <Icon
            className={styles.externalIcon}
            color={externalIconColor}
            icon="ExternalLinkTrimmed"
            size="small"
          />
        </span>
      ) : null}
    </a>
  );
};

const LaunchAppDeepLinkRawWithRef = forwardRef(
  (props: Omit<LaunchAppDeepLinkRawProps, 'forwardedRef'>, ref: Ref<HTMLAnchorElement>) => {
    const { children, ...rest } = props;
    return (
      <LaunchAppDeepLinkRaw forwardedRef={ref} {...rest}>
        {children}
      </LaunchAppDeepLinkRaw>
    );
  }
);

export { LaunchAppDeepLinkRawWithRef as LaunchAppDeepLinkRaw };
