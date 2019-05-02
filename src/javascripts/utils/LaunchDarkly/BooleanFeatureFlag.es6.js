import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

/**
 * React wrapper around Launch Darkly feature flags with boolean variation.
 *
 * @export
 * @class FeatureFlag
 * @extends {React.Component}
 */
export default class BooleanFeatureFlag extends React.Component {
  static propTypes = {
    featureFlagKey: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired
  };

  state = {
    currentVariation: undefined
  };
  async componentDidMount() {
    const currentVariation = await getCurrentVariation(this.props.featureFlagKey);

    if (this.isUnmounted) {
      return;
    }
    this.setState({
      currentVariation
    });
  }
  componentWillUnmount() {
    this.isUnmounted = true;
  }
  render() {
    if (_.isFunction(this.props.children)) {
      return this.props.children({ currentVariation: this.state.currentVariation });
    } else {
      return this.state.currentVariation ? this.props.children : null;
    }
  }
}
