import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NetlifyIcon from 'svg/logo-netlify';
import AlgoliaIcon from 'svg/logo-algolia';
import ImageManagementIcon from 'svg/logo-image-management';
import ContentfulLogoLight from 'svg/ContentfulLogoLight';
import GatsbyIcon from 'svg/GatsbyIcon';
import BynderIcon from 'svg/BynderIcon';
import CloudinaryIcon from 'svg/CloudinaryIcon';
import GenericAppIcon from 'svg/page-apps';
import DefaultIcon from 'ui/Components/Icon';

const Sizes = {
  xsmall: 20,
  small: 35,
  default: 40,
  large: 60
};

const Icons = {
  generic: GenericAppIcon,
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
    size: PropTypes.oneOf(['default', 'large', 'small', 'xsmall']),
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
