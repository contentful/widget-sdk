import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as InputModule} from './Input';
import {name as ButtonModule} from './Button';
import {name as WithReminderModule} from './WithReminder';
import {name as FormModule} from './Form';

const moduleName = 'DeploymentFormModule';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const Button = require(ButtonModule);
  const Input = require(InputModule);
  const WithReminder = require(WithReminderModule);
  const Form = require(FormModule);

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
        <WithReminder timeout={1000 * 60 * 3}>
          {({ showReminder, invalidate }) => {
            const deploymentForm = (
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
                    onChange={(value) => {
                      invalidate();
                      return this.onChange(value);
                    }}
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

            const reminder = (
              <div className={'modern-stack-onboarding--modal'}>
                <div className={'modern-stack-onboarding--modal-content'}>
                  <h2 className={'modern-stack-onboarding--title modern-stack-onboarding--title__small'}>
                    {'Is the '}
                    <strong>
                      {'Gatsby Starter for Contentful'}
                    </strong>
                    {' blog repository deployed?'}
                  </h2>
                  {deploymentForm}
                </div>
              </div>
            );

            return (
              <React.Fragment>
                {showReminder && reminder}
                {deploymentForm}
              </React.Fragment>
            );
          }}
        </WithReminder>
      );
    }
  });

  return DeploymentForm;
}]);

export const name = moduleName;
