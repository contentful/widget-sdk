import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as InputModule} from './Input';
import {name as ButtonModule} from './Button';

const moduleName = 'DeploymentFormModule';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const Button = require(ButtonModule);
  const Input = require(InputModule);

  const DeploymentForm = createReactClass({
    propTypes: {
      onComplete: PropTypes.func.isRequired
    },
    getInitialState () {
      return {
        url: '',
        error: false
      };
    },
    onChange (value) {
      const isValid = Boolean(value && (
        value.includes('netlify.com') || value.includes('heroku.com')
      ));
      this.setState({ url: value, error: isValid ? false : 'Please provide a URL on netlify or heroku.' });
    },
    onComplete () {
      this.props.onComplete(this.state.url);
    },
    render () {
      const { error, url } = this.state;
      return (
        <div className={'modern-stack-onboarding--deployment-form'}>
          <h4 className={'modern-stack-onboarding--deployment-form-title'}>
            <strong>
              {'Enter the website URL after deployment is complete.'}
            </strong>
            <br />
            {'Your suggested next steps will be determined by the deployment service you selected.'}
          </h4>
          <Input
            wrapperClassName={'modern-stack-onboarding--deployment-form-input'}
            value={url}
            onChange={this.onChange}
            placeholder={'Enter the website url of the deployed site'}
            error={url && error}
          />
          <Button
            className={'modern-stack-onboarding--deployment-form-button'}
            onClick={this.onComplete}
            disabled={Boolean(!url || error)}
          >
            {'Deployment Complete'}
          </Button>
        </div>
      );
    }
  });

  return DeploymentForm;
}]);

export const name = moduleName;
