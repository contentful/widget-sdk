import React from 'react';
import { css } from 'emotion';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import * as Analytics from 'analytics/Analytics';
import { isIE } from 'utils/browser';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag';
import * as FeatureFlagKey from 'featureFlags';

const styles = {
  container: css({
    position: 'fixed',
    bottom: '40%',
    width: '100%',
    left: 0,
    right: 0
  }),
  note: css({
    width: '700px',
    margin: '0 auto'
  })
};

function DeprecationNotice() {
  return (
    <div className={styles.container}>
      <Note className={styles.note} noteType="warning">
        {`Internet Explorer 11 is not supported. Please use a different browser. For more information `}
        <TextLink
          href="//www.contentful.com/faq/about-contentful/#which-browsers-does-contentful-support"
          target="_blank">
          see the FAQ
        </TextLink>
        .
      </Note>
    </div>
  );
}

function sendAnalyticsEvent() {
  Analytics.track('ie11_deprecation_notice:shown');
}

export default function Ie11DeprecationNotice() {
  const isIe11 = isIE();

  if (!isIe11) {
    return null;
  }

  return (
    <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.IE11_DEPRECATION_NOTICE}>
      {({ currentVariation }) => {
        if (currentVariation) {
          sendAnalyticsEvent();
          return <DeprecationNotice />;
        } else {
          return null;
        }
      }}
    </BooleanFeatureFlag>
  );
}
