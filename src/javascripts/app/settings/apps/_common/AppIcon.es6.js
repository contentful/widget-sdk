import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NetlifyIcon from 'svg/logo-netlify.es6';
import AlgoliaIcon from 'svg/logo-algolia.es6';
import ImageManagementIcon from 'svg/logo-image-management.es6';
import ContentfulLogoLight from 'svg/ContentfulLogoLight.es6';
import GatsbyIcon from 'svg/GatsbyIcon.es6';
import BynderIcon from 'svg/BynderIcon.es6';
import CloudinaryIcon from 'svg/CloudinaryIcon.es6';
import DefaultIcon from 'ui/Components/Icon.es6';

const Sizes = {
  small: 35,
  default: 40,
  large: 60
};

const Icons = {
  contentful: ContentfulLogoLight,
  netlify: NetlifyIcon,
  algolia: AlgoliaIcon,
  aiImageManagement: ImageManagementIcon,
  gatsby: GatsbyIcon,
  bynder: BynderIcon,
  cloudinary: CloudinaryIcon
};

export default class AppIcon extends Component {
  static propTypes = {
    appId: PropTypes.string,
    size: PropTypes.oneOf(['default', 'large', 'small']),
    className: PropTypes.string
  };

  static defaultProps = {
    size: 'default',
    appId: ''
  };

  render() {
    const size = Sizes[this.props.size] || Sizes.default;
    const Icon = Icons[this.props.appId];

    if (!Icon) {
      return <DefaultIcon name="page-apps" className={this.props.className} />;
    }

    return <Icon height={size} width={size} className={this.props.className} />;
  }
}
