import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';
import { Pluralized } from 'core/components/formatting';
import { isOrgOnPlatformTrial } from '../services/PlatformTrialService';
import { calcTrialDaysLeft } from '../utils';

export const PlatformTrialInfo = ({ organization }) => {
  if (!isOrgOnPlatformTrial(organization)) {
    return null;
  }

  const daysLeft = calcTrialDaysLeft(organization.trialPeriodEndsAt);

  return (
    <Typography testId="platform-trial-info">
      <Heading className="section-title">Trial</Heading>
      <Paragraph>
        {daysLeft === 0 ? (
          <>
            Your trial ends <b>today</b>.
          </>
        ) : (
          <>
            Your trial will end in{' '}
            <b>
              <Pluralized text="day" count={daysLeft} />
            </b>
            .
          </>
        )}
      </Paragraph>
      <Paragraph>
        At the end of your Enterprise Trial, one of our Contentful experts will reach out to you.
        <br />
        Together, you’ll review the outcomes of your trial, and make a decision regarding upgrading
        to the Enterprise tier. If you do not upgrade to the Enterprise tier, you will be
        transitioned back to your previous tier.
      </Paragraph>
    </Typography>
  );
};

PlatformTrialInfo.propTypes = {
  organization: PropTypes.object.isRequired,
};
