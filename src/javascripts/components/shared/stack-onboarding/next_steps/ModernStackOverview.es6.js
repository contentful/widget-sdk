import React from 'react';
import PropTypes from 'prop-types';
import DevChoiceAccordion from 'components/shared/stack-onboarding/next_steps/DevChoiceAccordion.es6';
import ResumeOnboarding from 'components/shared/stack-onboarding/next_steps/ResumeOnboarding.es6';

const ModernStackOverview = props => {
  return props.managementToken && props.entry && props.deploymentProvider ? (
    <DevChoiceAccordion {...props} />
  ) : (
    <ResumeOnboarding />
  );
};

ModernStackOverview.propTypes = {
  managementToken: PropTypes.string,
  entry: PropTypes.object,
  deploymentProvider: PropTypes.string
};

export default ModernStackOverview;
