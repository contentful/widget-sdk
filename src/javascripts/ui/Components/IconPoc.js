import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
// import tokens from '@contentful/forma-36-tokens';

import settingsFilled from 'svg/icons/settings-filled.svg';
import settingsMono from 'svg/icons/settings-mono.svg';
import tokensFilled from 'svg/icons/tokens-filled.svg';
import tokensMono from 'svg/icons/tokens-mono.svg';

const SVGs = {
  'settings-filled': settingsFilled,
  'settings-mono': settingsMono,
  'tokens-filled': tokensFilled,
  'tokens-mono': tokensMono
};

const sizes = {
  small: '18px',
  medium: '24px',
  large: '36px'
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
      width: sizes.small,
      height: sizes.small,
      maxWidth: sizes.small,
      maxHeight: sizes.small
    }),
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
      data-icon-name={name}
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
