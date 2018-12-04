import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AppGenericIcon from 'svg/app-generic.es6';
import NetlifyIcon from 'svg/logo-netlify.es6';
import AlgoliaIcon from 'svg/logo-algolia.es6';
import OptimizelyLogo from 'svg/logo-optimizely.es6';

const Sizes = {
  default: 40,
  large: 60
};

const Icons = {
  default: AppGenericIcon,
  netlify: NetlifyIcon,
  algolia: AlgoliaIcon,
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
    const Icon = Icons[this.props.appId] || Icons.default;
    return <Icon height={size} width={size} />;
  }
}
