import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

/**
 * React wrapper around Product Catalog space features with boolean variation.
 *
 * @export
 * @class BooleanSpaceFeature
 * @extends {React.Component}
 */
export default class BooleanSpaceFeature extends React.Component {
  static propTypes = {
    spaceFeatureKey: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  };

  static contextType = SpaceEnvContext;

  state = {
    currentVariation: undefined,
  };
  async componentDidMount() {
    const { currentSpaceId } = this.context;
    const currentVariation = await getSpaceFeature(
      currentSpaceId,
      this.props.spaceFeatureKey,
      false
    );

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
