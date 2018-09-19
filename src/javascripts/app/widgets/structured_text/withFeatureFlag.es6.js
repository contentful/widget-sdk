import React from 'react';
import { onFeatureFlag } from 'utils/LaunchDarkly';

const features = {
  embedInlineEntry: 'feature-at-09-2018-structured-text-inline-entries'
};

export default function withFeatureFlag(Component) {
  return class extends React.Component {
    state = {
      features: {}
    };

    constructor(props) {
      super(props);
      Object.keys(features).map(key => {
        onFeatureFlag(this.props.scope, features[key], flagValue => {
          this.setState({
            features: {
              [key]: flagValue,
              ...this.state.features
            }
          });
        });
      });
    }

    render() {
      return <Component features={this.state.features} {...this.props} />;
    }
  };
}
