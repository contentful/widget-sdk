import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DefaultAppIcon from 'svg/default-app-icon.es6';
import NetlifyIcon from 'svg/logo-netlify.es6';
import AlgoliaIcon from 'svg/logo-algolia.es6';
import ImageManagementIcon from 'svg/logo-image-management.es6';
import OptimizelyLogo from 'svg/logo-optimizely.es6';
import ContentfulLogoLight from 'svg/ContentfulLogoLight.es6';

const Sizes = {
  default: 40,
  large: 60
};

const Icons = {
  contentful: ContentfulLogoLight,
  netlify: NetlifyIcon,
  algolia: AlgoliaIcon,
  aiImageManagement: ImageManagementIcon,
  basicApprovalWorkflow: DefaultAppIcon,
  optimizely: OptimizelyLogo
};

export default class AppIcon extends Component {
  static propTypes = {
    appId: PropTypes.string.isRequired,
    size: PropTypes.oneOf(['default', 'large']),
    className: PropTypes.string
  };

  static defaultProps = {
    size: 'default'
  };

  render() {
    const size = Sizes[this.props.size] || Sizes.default;
    const Icon = Icons[this.props.appId];
    return <Icon height={size} width={size} className={this.props.className} />;
  }
}
