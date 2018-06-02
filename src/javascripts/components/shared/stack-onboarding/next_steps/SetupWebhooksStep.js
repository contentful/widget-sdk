import React from 'react';
import PropTypes from 'prop-types';
import {SETUP_WEBHOOK} from './DevNextSteps';

const moduleName = 'ms-dev-next-steps-setup-webhook';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const {env} = require('environment');
    const {Step} = require('app/home/welcome/OnboardingWithTeaSteps');

    const SetupWebhooksStep = (props) => {
      const {
        isExpanded,
        isDone,
        onToggle,
        deploymentProvider,
        markAsDone
      } = props;
      const propsForStep = {
        headerCopy: 'Set-up webhooks for the Gatsby Starter for Contentful blog ',
        headerIcon: 'page-apis',
        isExpanded,
        isDone,
        onToggle,
        stepKey: SETUP_WEBHOOK
      };
      const domain =
        env === 'production'
        ? 'https://www.contentful.com'
        : 'http://ctf-doc-app-branch-feature-webhooks-guide.netlify.com';
      const url =
        `${domain}/developers/docs/tutorials/general/automate-site-builds-with-webhooks/#${deploymentProvider}`;

      return (
        <Step {...propsForStep}>
          <div className='tea-onboarding__step-description'>
            <p>Some text to do with setting up a webhook</p>
            <p>Some more copy if need be</p>
          </div>
          <a
            href={url}
            target={'_blank'}
            rel={'noopener'}
            className='btn-action tea-onboarding__step-cta'
            onClick={_ => markAsDone()}>
            Create webhook
          </a>
        </Step>
      );
    };

    SetupWebhooksStep.propTypes = {
      isExpanded: PropTypes.bool.isRequired,
      isDone: PropTypes.bool.isRequired,
      onToggle: PropTypes.func.isRequired,
      markAsDone: PropTypes.func.isRequired,
      deploymentProvider: PropTypes.string.isRequired
    };


    return SetupWebhooksStep;
  }]);

export {moduleName as name};
