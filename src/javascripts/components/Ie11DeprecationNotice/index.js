import React, { useState } from 'react';
import { css } from 'emotion';
import { Note, IconButton, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as Analytics from 'analytics/Analytics';
import { isIE } from 'utils/browser';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag';
import * as FeatureFlagKey from 'featureFlags';

const styles = {
  note: css({
    position: 'fixed',
    right: tokens.spacingXl,
    bottom: tokens.spacingXl,
    width: '330px'
  }),
  closeButton: css({
    position: 'absolute',
    right: tokens.spacing2Xs,
    top: tokens.spacing2Xs
  })
};

function DeprecationNotice() {
  const [isVisible, setIsVisible] = useState(true);
  return (
    isVisible && (
      <Note className={styles.note} noteType="warning">
        <IconButton
          className={styles.closeButton}
          iconProps={{
            icon: 'Close'
          }}
          buttonType="secondary"
          onClick={() => setIsVisible(false)}
        />
        {`Support for your current browser "Internet Explorer 11" will be discontinued as of January 2020. For more information `}
        <TextLink
          href="//www.contentful.com/faq/about-contentful/#which-browsers-does-contentful-support"
          target="_blank">
          see the FAQ
        </TextLink>
        .
      </Note>
    )
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
