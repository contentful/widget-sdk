import React from 'react';
import { QUICK_NAVIGATION } from 'featureFlags.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import QuickNav from './QuickNav.es6';

export default class QuickNavWithFeatureFlag extends React.Component {
  render() {
    return (
      <BooleanFeatureFlag featureFlagKey={QUICK_NAVIGATION}>
        <QuickNav />
      </BooleanFeatureFlag>
    );
  }
}
