import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NetlifyIcon from 'svg/logo-netlify.es6';
import AlgoliaIcon from 'svg/logo-algolia.es6';
import ImageManagementIcon from 'svg/logo-image-management.es6';
import OptimizelyLogo from 'svg/logo-optimizely.es6';
import { APP_ID as IMAGE_MANAGEMENT_APP_ID } from '../image-management/Constants.es6';

const Sizes = {
  default: 40,
  large: 60
};

const Icons = {
  netlify: NetlifyIcon,
  algolia: AlgoliaIcon,
  [IMAGE_MANAGEMENT_APP_ID]: ImageManagementIcon,
  optimizely: OptimizelyLogo
};

export default class AppIcon extends Component {
  static propTypes = {
    appId: PropTypes.string.isRequired,
    size: PropTypes.oneOf(['default', 'large'])
  };

  static defaultProps = {
    size: 'default'
  };

  render() {
    const size = Sizes[this.props.size] || Sizes.default;
    const Icon = Icons[this.props.appId];
    return <Icon height={size} width={size} />;
  }
}
