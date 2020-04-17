import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getModule } from 'core/NgRegistry';

import { getVariation } from 'LaunchDarkly';

/**
 * React wrapper around Launch Darkly feature flags with boolean variation.
 *
 * @export
 * @class FeatureFlag
 * @extends {React.Component}
 */
export class BooleanFeatureFlag extends React.Component {
  static propTypes = {
    featureFlagKey: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  };

  state = {
    currentVariation: undefined,
  };
  async componentDidMount() {
    const spaceContext = getModule('spaceContext');
    const currentVariation = await getVariation(this.props.featureFlagKey, {
      organizationId: spaceContext.getData('organization.sys.id'),
      spaceId: spaceContext.getId(),
    });

    if (this.isUnmounted) {
      return;
    }
    this.setState({
      currentVariation,
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
