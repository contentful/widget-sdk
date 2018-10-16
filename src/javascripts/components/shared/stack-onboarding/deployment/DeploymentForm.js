import React from 'react';
import PropTypes from 'prop-types';

import { name as CreateModernOnboardingModule } from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'DeploymentFormModule';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const Button = require('components/react/atoms/Button.es6').default;
    const Input = require('components/react/atoms/Input.es6').default;
    const Form = require('components/react/atoms/Form.es6').default;
    const store = require('TheStore').getStore();
    const {
      getStoragePrefix,
      MODERN_STACK_ONBOARDING_COMPLETE_EVENT
    } = require(CreateModernOnboardingModule);
    const $rootScope = require('$rootScope');

    const DEPLOYMENT_PROVIDERS = {
      NETLIFY: 'netlify',
      HEROKU: 'heroku'
    };

    class DeploymentForm extends React.Component {
      static propTypes = {
        onComplete: PropTypes.func.isRequired
      };

      state = {
        url: store.get(`${getStoragePrefix()}:deployedTo`) || '',
        error: false
      };

      isValidDeployedUrl = url => {
        return Object.values(DEPLOYMENT_PROVIDERS).includes(this.getChosenDeploymentProvider(url));
      };

      getChosenDeploymentProvider = url => {
        if (url.includes('netlify.com')) {
          return DEPLOYMENT_PROVIDERS.NETLIFY;
        }

        if (url.includes('herokuapp.com')) {
          return DEPLOYMENT_PROVIDERS.HEROKU;
        }
      };

      markAsInvalidUrl = url => {
        this.setState({
          url,
          error: 'Please provide the Netlify or Heroku URL of your deployed application.'
        });
      };

      onChange = url => {
        if (!this.isValidDeployedUrl(url)) {
          this.markAsInvalidUrl(url);
        } else {
          this.setState({ url, error: false });
        }
      };

      onComplete = event => {
        const { url } = this.state;
        const prefix = getStoragePrefix();

        if (this.isValidDeployedUrl(url)) {
          const provider = this.getChosenDeploymentProvider(url);
          store.set(`${prefix}:completed`, true);
          store.set(`${prefix}:deploymentProvider`, provider);
          store.set(`${prefix}:deployedTo`, url);

          // let other disconnected but dependent component re-render
          // once user completes onboarding
          // TODO: This can and should be done better but I can't think
          // of a better way given the current code base.
          $rootScope.$broadcast(MODERN_STACK_ONBOARDING_COMPLETE_EVENT);

          this.props.onComplete(event, provider);
        } else {
          this.markAsInvalidUrl(url);
        }
      };

      render() {
        const { url, error } = this.state;
        return (
          <div className="modern-stack-onboarding--deployment-form">
            <h4 className="modern-stack-onboarding--deployment-form-title">
              Enter the website URL after deployment is complete.
            </h4>
            <div className="modern-stack-onboarding--deployment-form-subtitle">
              We’ll provide guidance to set up webhooks based on the hosting service you’ve
              selected.
            </div>
            <Form onSubmit={e => e.preventDefault()}>
              <Input
                wrapperClassName="modern-stack-onboarding--deployment-form-input"
                value={url}
                onChange={this.onChange}
                placeholder="Enter the website URL"
                error={url && error}
                data-test-id="onboarding-deploy-input-container"
              />
              <Button
                type="submit"
                className="modern-stack-onboarding--deployment-form-button"
                onClick={this.onComplete}
                disabled={Boolean(!url || error)}
                data-test-id="onboarding-view-next-steps-cta">
                View next steps
              </Button>
            </Form>
          </div>
        );
      }
    }

    return DeploymentForm;
  }
]);
