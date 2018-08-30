import React from 'react';
import PropTypes from 'prop-types';
import { SETUP_WEBHOOK } from './DevNextSteps';
import { name as AnchorModule } from '../../../react/atoms/Anchor';

export const name = 'ms-dev-next-steps-setup-webhook';

angular.module('contentful').factory(name, [
  'require',
  require => {
    const { env } = require('environment');
    const { Step } = require('app/home/welcome/OnboardingWithTeaSteps.es6');
    const A = require(AnchorModule);

    const SetupWebhooksStep = props => {
      const { isExpanded, isDone, onToggle, deploymentProvider, markAsDone } = props;
      const propsForStep = {
        headerCopy: 'Automate rebuilds of the Gatsby Starter for Contentful blog with webhooks',
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
      const url = `${domain}/developers/docs/tutorials/general/automate-site-builds-with-webhooks/#${deploymentProvider}`;

      return (
        <Step {...propsForStep}>
          <div className="tea-onboarding__step-description">
            <p>
              You can automate the rebuilds of the blog by setting up webhooks that trigger when you
              publish or unpublish content in this space.
            </p>
            {deploymentProvider === 'netlify' ? <NetlifyPrerequisite /> : <HerokuPrerequisite />}
            <A
              href={url}
              className="btn-action tea-onboarding__step-cta u-separator--small"
              onClick={_ => markAsDone()}>
              View webhook guide
            </A>
          </div>
        </Step>
      );
    };

    const NetlifyPrerequisite = () => {
      return (
        <React.Fragment>
          <h5>Prerequisites for Netlify</h5>
          <p>
            Your site must already be deployed to Netlify, and you must have configured it for
            continuous deployment by connecting it to a remote Git repo. If you haven’t done so
            already, follow the guide on the Netlify documentation.
          </p>
        </React.Fragment>
      );
    };

    const HerokuPrerequisite = () => {
      return (
        <React.Fragment>
          <h5>Prerequisites for Heroku</h5>
          <p>
            You must have an account with CircleCI and your site must already be deployed to Heroku.
            You should also have a remote Git repo configured for your project hosted on either
            Github, GitLab, or Bitbucket. For our purposes, we’ll assume the project is hosted on
            Github.
          </p>
        </React.Fragment>
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
  }
]);
