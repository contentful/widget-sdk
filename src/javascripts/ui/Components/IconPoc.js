import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
// import tokens from '@contentful/forma-36-tokens';

// account settings
import settingsFilled from 'svg/icons/settings-filled.svg';
import settingsMono from 'svg/icons/settings-mono.svg';
import spacesFilled from 'svg/icons/spaces-filled.svg';
import spacesMono from 'svg/icons/spaces-mono.svg';
import organizationsFilled from 'svg/icons/organizations-filled.svg';
import organizationsMono from 'svg/icons/organizations-mono.svg';
import tokenFilled from 'svg/icons/token-filled.svg';
import tokenMono from 'svg/icons/token-mono.svg';
import oauthFilled from 'svg/icons/oauth-filled.svg';
import oauthMono from 'svg/icons/oauth-mono.svg';
// organization settings

const SVGs = {
  'settings-filled': settingsFilled,
  'settings-mono': settingsMono,
  'spaces-mono': spacesMono,
  'spaces-filled': spacesFilled,
  'organizations-filled': organizationsFilled,
  'organizations-mono': organizationsMono,
  'token-filled': tokenFilled,
  'token-mono': tokenMono,
  'oauth-filled': oauthFilled,
  'oauth-mono': oauthMono
};

const sizes = {
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
    medium: css({
      width: sizes.medium,
      height: sizes.medium,
      maxWidth: sizes.medium,
      maxHeight: sizes.medium
    }),
    large: css({
      width: sizes.large,
      height: sizes.large,
      maxWidth: sizes.large,
      maxHeight: sizes.large
    })
  }
};

const IconPoc = ({ className, size, name, filled, style, color }) => {
  const IconComponent = SVGs[filled ? `${name}-filled` : `${name}-mono`];

  const iconSvgStyle = css({
    flexShrink: 0,
    fill: !filled ? color : null
  });

  if (!IconComponent) {
    // eslint-disable-next-line
    console.warn(`"${name}" is not imported in Icon`);
  }

  return (
    <div
      data-test-id="product-icon"
      data-icon-name={!filled ? `nav-name` : null}
      className={cx('icon-component', className, styles.flexShrink, styles.pocIcon.svg, {
        [`${styles.sizes[size]}`]: size
      })}
      style={style}>
      {IconComponent && <IconComponent className={iconSvgStyle} />}
    </div>
  );
};

IconPoc.propTypes = {
  size: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  filled: PropTypes.bool,
  style: PropTypes.object,
  color: PropTypes.string,
  className: PropTypes.string
};

export default IconPoc;
