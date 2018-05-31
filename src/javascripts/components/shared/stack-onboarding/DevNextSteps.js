import React from 'react';
import PropTypes from 'prop-types';

const MODIFY_CONTENT = 'modifyContent';
const SETUP_WEBHOOK = 'setupWebhook';
const NOT_A_JS_DEV = 'notAJSDev';
const moduleName = 'ms-isolated-dev-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const {Progress, Header} = require('app/home/welcome/OnboardingWithTea');
    const {Step, AltStep} = require('app/home/welcome/OnboardingWithTeaSteps');

    class DevNextSteps extends React.Component {
      constructor () {
        super();

        this.state = {
          [MODIFY_CONTENT]: {
            isExpanded: true,
            isDone: false
          },
          [SETUP_WEBHOOK]: {
            isExpanded: false,
            isDone: false
          },
          [NOT_A_JS_DEV]: {
            isDone: false
          }
        };
      }

      getProgress () {
        return Object.values(this.state)
          .map(v => v.isDone)
          .reduce((isDone, count) => count + Number(Boolean(isDone)), 0);
      }

      render () {
        return (
          <section className='home-section tea-onboarding'>
            <Header>
              <h3 className='tea-onboarding__heading'>Next steps</h3>
              <Progress count={this.getProgress()} total={3} />
            </Header>
            <div className='tea-onboarding__steps'>
              <ModifyContentStep {...this.state[MODIFY_CONTENT]} />
              <SetupWebhooksStep {...this.state[SETUP_WEBHOOK]} />
              <NotAJSDeveloperStep {...this.state[NOT_A_JS_DEV]} />
            </div>
          </section>
        );
      }
    }

    return DevNextSteps;
  }]);

export { moduleName as name };
