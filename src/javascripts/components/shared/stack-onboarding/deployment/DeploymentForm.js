import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

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
  const {user$} = require('services/TokenStore');
  const {getValue} = require('utils/kefir');
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
        url: '',
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
      } else if (url.includes('herokuapp.com')) {
        return DEPLOYMENT_PROVIDERS.HEROKU;
      }
    },
    markAsInvalidUrl (url) {
      this.setState({ url: url, error: 'Please provide the Netlify or Heroku URL of your deployed application.' });
    },
    onChange (url) {
      if (!this.isValidDeployedUrl(url)) {
        this.markAsInvalidUrl(url);
      } else {
        this.setState({ url, error: false });
      }
    },
    onComplete () {
      const {url} = this.state;

      if (this.isValidDeployedUrl(url)) {
        const user = getValue(user$);
        const prefix = `ctfl:${user.sys.id}:modernStackOnboarding`;

        store.set(`${prefix}:completed`, true);
        store.set(`${prefix}:deployedTo`, this.getChosenDeploymentProvider(url));

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
            <strong>
              Enter the website URL after deployment is complete.
            </strong>
            <br />
            Your suggested next steps will be determined by the deployment service you selected.
          </h4>
          <Form>
            <Input
              wrapperClassName='modern-stack-onboarding--deployment-form-input'
              value={url}
              onChange={this.onChange}
              placeholder='Enter the website url of the deployed site'
              error={url && error}
            />
            <Button
              type='submit'
              className='modern-stack-onboarding--deployment-form-button'
              onClick={this.onComplete}
              disabled={Boolean(!url || error)}
            >
              Deployment Complete
            </Button>
          </Form>
        </div>
      );
    }
  });

  return DeploymentForm;
}]);
