import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContentfulLogoLight from 'svg/ContentfulLogoLight.svg';
import GenericAppIcon from 'svg/page-apps.svg';

const SIZES = {
  xsmall: 20,
  small: 35,
  default: 40,
  large: 60
};

const ICONS = {
  generic: GenericAppIcon,
  contentful: ContentfulLogoLight
};

export default class AppIcon extends Component {
  static propTypes = {
    appId: PropTypes.string,
    size: PropTypes.oneOf(['default', 'large', 'small', 'xsmall']),
    className: PropTypes.string
  };

  render() {
    const size = SIZES[this.props.size] || SIZES.default;
    const Icon = ICONS[this.props.appId] || ICONS.generic;

    return <Icon height={size} width={size} className={this.props.className} />;
  }
}
