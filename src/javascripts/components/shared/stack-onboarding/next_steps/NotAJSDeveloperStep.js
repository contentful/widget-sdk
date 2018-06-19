import React from 'react';
import PropTypes from 'prop-types';

export const name = 'ms-dev-next-steps-not-a-js-dev';

angular.module('contentful')
  .factory(name, ['require', require => {
    const {AltStep} = require('app/home/welcome/OnboardingWithTeaSteps');

    const NotAJSDeveloperStep = ({markAsDone, isDone}) => {
      const scrollToSupportedPlatforms = () => {
        markAsDone();
        // Postpone the scroll till the auto expansion of next
        // steps is handled so that the browser is able to
        // calculate the correct offset to scroll to
        setTimeout(() => {
          document
          .querySelector('cf-developer-resources')
          .scrollIntoView(
            {block: 'start', behavior: 'smooth'}
          );
        }, 100);
      };

      const propsForAltStep = {
        headerCopy: 'Not a JS developer? See guides for other supported platforms',
        headerIcon: 'icon-pages',
        isDone
      };

      return (
        <AltStep {...propsForAltStep}>
          <span
            className='tea-onboarding__alt-step-cta'
            onClick={scrollToSupportedPlatforms}
          >
            Select platform
            <span className='arrow'></span>
          </span>
        </AltStep>
      );
    };

    NotAJSDeveloperStep.propTypes = {
      isDone: PropTypes.bool.isRequired,
      markAsDone: PropTypes.func.isRequired
    };

    return NotAJSDeveloperStep;
  }]);
