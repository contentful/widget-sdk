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
    onChange (value) {
      const { onProviderChange } = this.props;
      const usesNetlify = value && value.includes('netlify.com');
      const usesHeroku = value && value.includes('heroku.com');
      const isValid = usesNetlify || usesHeroku;

      if (isValid && onProviderChange) {
        onProviderChange(usesNetlify ? 'netlify' : 'heroku');
      }

      this.setState({ url: value, error: isValid ? false : 'Please provide a URL on netlify or heroku.' });
    },
    onComplete () {
      this.props.onComplete(this.state.url);
    },
    render () {
      const { url, error } = this.state;
      return (
        <div className={'modern-stack-onboarding--deployment-form'}>
          <h4 className={'modern-stack-onboarding--deployment-form-title'}>
            <strong>
              {'Enter the website URL after deployment is complete.'}
            </strong>
            <br />
            {'Your suggested next steps will be determined by the deployment service you selected.'}
          </h4>
          <Form>
            <Input
              wrapperClassName={'modern-stack-onboarding--deployment-form-input'}
              value={url}
              onChange={this.onChange}
              placeholder={'Enter the website url of the deployed site'}
              error={url && error}
            />
            <Button
              type={'submit'}
              className={'modern-stack-onboarding--deployment-form-button'}
              onClick={this.onComplete}
              disabled={Boolean(!url || error)}
            >
              {'Deployment Complete'}
            </Button>
          </Form>
        </div>
      );
    }
  });

  return DeploymentForm;
}]);
