import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

// account settings
import userProfile from './icons/user-profile.svg';
import spaces from './icons/spaces.svg';
import organizationsMono from './icons/organizations.svg';
import tokenMono from './icons/token.svg';
import oauthMono from './icons/oauth.svg';
// organization settings
import orgInfo from './icons/org-info.svg';
import subscription from './icons/subscription.svg';
import usage from './icons/usage.svg';
import users from './icons/users.svg';
import teams from './icons/teams.svg';
import apps from './icons/apps.svg';
import sso from './icons/sso.svg';
// space settings
import home from './icons/home.svg';
import contentModel from './icons/content-model.svg';
import content from './icons/content.svg';
import media from './icons/media.svg';
import settings from './icons/settings.svg';
import apis from './icons/apis.svg';
import billing from './icons/billing.svg';

const SVGs = {
  'user-profile': userProfile,
  spaces: spaces,
  organizations: organizationsMono,
  token: tokenMono,
  oauth: oauthMono,
  'org-info': orgInfo,
  subscription: subscription,
  usage: usage,
  users: users,
  teams: teams,
  apps: apps,
  sso: sso,
  home: home,
  'content-model': contentModel,
  content: content,
  media: media,
  settings: settings,
  apis: apis,
  billing: billing
};

const colorsConfig = {
  white: tokens.colorWhite,
  green: tokens.colorGreenBase
};

const sizesConfig = {
  small: '18px',
  medium: '24px',
  large: '32px'
};

const styles = {
  pocIcon: {
    svg: css({
      width: '100%',
      height: '100%',
      display: 'block'
    })
  },
  flexShrink: 0,
  sizes: {
    small: css({
      width: sizesConfig.small,
      height: sizesConfig.small,
      maxWidth: sizesConfig.small,
      maxHeight: sizesConfig.small,
      minWidth: sizesConfig.small,
      minHeight: sizesConfig.small
    }),
    medium: css({
      width: sizesConfig.medium,
      height: sizesConfig.medium,
      maxWidth: sizesConfig.medium,
      maxHeight: sizesConfig.medium,
      minWidth: sizesConfig.medium,
      minHeight: sizesConfig.medium
    }),
    large: css({
      width: sizesConfig.large,
      height: sizesConfig.large,
      maxWidth: sizesConfig.large,
      maxHeight: sizesConfig.large,
      minWidth: sizesConfig.large,
      minHeight: sizesConfig.large
    })
  }
};

const NavigationIcon = ({ className, size, icon, style, color, inNavigation }) => {
  const IconComponent = SVGs[icon];

  const iconSvgStyle = css({
    fill: colorsConfig[color]
  });

  if (!IconComponent) {
    // eslint-disable-next-line
    console.warn(`"${icon}" is not imported in Icon`);
  }

  return (
    <div
      data-test-id="product-icon"
      data-icon-name={inNavigation ? `nav-${icon}` : `headline-${icon}`} // temporary, CSS for navigation will be refactored
      className={cx('icon-component', className, styles.flexShrink, styles.pocIcon.svg, {
        [`${styles.sizes[size]}`]: size
      })}
      style={style}>
      {IconComponent && <IconComponent className={iconSvgStyle} />}
    </div>
  );
};

NavigationIcon.propTypes = {
  size: PropTypes.oneOf(Object.keys(sizesConfig)).isRequired,
  icon: PropTypes.oneOf(Object.keys(SVGs)).isRequired,
  color: PropTypes.oneOf(Object.keys(colorsConfig)).isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  inNavigation: PropTypes.bool // this is just temporary, will be removed as soon as navigation styles will be refactored
};

export default NavigationIcon;
