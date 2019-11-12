import React from 'react';
import { QUICK_NAVIGATION } from 'featureFlags';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag';
import QuickNav from './QuickNav';

export default class QuickNavWithFeatureFlag extends React.Component {
  render() {
    return (
      <BooleanFeatureFlag featureFlagKey={QUICK_NAVIGATION}>
        <QuickNav />
      </BooleanFeatureFlag>
    );
  }
}
