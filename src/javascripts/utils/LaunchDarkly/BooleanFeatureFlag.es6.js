import React from 'react';
import PropTypes from 'prop-types';

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
    featureFlagKey: PropTypes.string.isRequired
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
    return this.state.currentVariation ? this.props.children : null;
  }
}
