import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';
import {name as InputModule} from '../../../react/atoms/Input';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as FormModule} from '../../../react/atoms/Form';

export const name = 'DeploymentFormModule';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Button = require(ButtonModule);
  const Input = require(InputModule);
  const Form = require(FormModule);
  const store = require('TheStore').getStore();
  const {getStoragePrefix} = require(CreateModernOnboardingModule);

  const DEPLOYMENT_PROVIDERS = {
    NETLIFY: 'netlify',
    HEROKU: 'heroku'
  };

  const DeploymentForm = createReactClass({
    propTypes: {
      onComplete: PropTypes.func.isRequired,
      onProviderChange: PropTypes.func
    },
    getInitialState () {
      return {
        url: store.get(`${getStoragePrefix()}:deployedTo`) || '',
        error: false
      };
    },
    isValidDeployedUrl (url) {
      return Object.values(DEPLOYMENT_PROVIDERS)
        .includes(this.getChosenDeploymentProvider(url));
    },
    getChosenDeploymentProvider (url) {
      if (url.includes('netlify.com')) {
        return DEPLOYMENT_PROVIDERS.NETLIFY;
      }

      if (url.includes('herokuapp.com')) {
        return DEPLOYMENT_PROVIDERS.HEROKU;
      }
    },
    markAsInvalidUrl (url) {
      this.setState({ url, error: 'Please provide the Netlify or Heroku URL of your deployed application.' });
    },
    onChange (url) {
      if (!this.isValidDeployedUrl(url)) {
        this.markAsInvalidUrl(url);
      } else {
        const { onProviderChange } = this.props;

        onProviderChange && onProviderChange(this.getChosenDeploymentProvider(url));
        this.setState({ url, error: false });
      }
    },
    onComplete () {
      const {url} = this.state;
      const prefix = getStoragePrefix();

      if (this.isValidDeployedUrl(url)) {
        store.set(`${prefix}:completed`, true);
        store.set(`${prefix}:deploymentProvider`, this.getChosenDeploymentProvider(url));
        store.set(`${prefix}:deployedTo`, url);

        this.props.onComplete(url);
      } else {
        this.markAsInvalidUrl(url);
      }
    },
    render () {
      const { url, error } = this.state;
      return (
        <div className='modern-stack-onboarding--deployment-form'>
          <h4 className='modern-stack-onboarding--deployment-form-title'>
            {'Enter the website URL after deployment is complete.'}
          </h4>
          <div className={'modern-stack-onboarding--deployment-form-subtitle'}>
            We’ll suggest next steps based on the hosting service you selected.
          </div>
          <Form onSubmit={e => e.preventDefault()}>
            <Input
              wrapperClassName='modern-stack-onboarding--deployment-form-input'
              value={url}
              onChange={this.onChange}
              placeholder='Enter the website URL'
              error={url && error}
            />
            <Button
              type='submit'
              className='modern-stack-onboarding--deployment-form-button'
              onClick={this.onComplete}
              disabled={Boolean(!url || error)}
            >
              View next steps
            </Button>
          </Form>
        </div>
      );
    }
  });

  return DeploymentForm;
}]);
