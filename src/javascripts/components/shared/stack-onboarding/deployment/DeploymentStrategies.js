import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from '../../../react/molecules/Tabs';
import {name as CodeModule} from '../../../react/atoms/Code';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';
import {name as AnchorModule} from '../../../react/atoms/Anchor';

export const name = 'deployment-strategies-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Tabs = require(TabsModule);
  const Code = require(CodeModule);
  const A = require(AnchorModule);
  const {getCredentials} = require(CreateModernOnboardingModule);
  const spaceContext = require('spaceContext');

  const DeploymentStrategies = createReactClass({
    getInitialState () {
      return {
        active: 'netlify'
      };
    },
    async componentDidMount () {
      const spaceId = spaceContext.space && spaceContext.space.getSys().id;
      const {deliveryToken} = await getCredentials();

      this.setState({
        spaceId,
        deliveryToken
      });
    },
    selectTab (tabId) {
      this.setState({ active: tabId });
    },
    renderCode (code) {
      return <Code lineNumbers={false} copy code={code} tooltipPosition='right' />;
    },
    renderList (steps) {
      const stepsMarkup = steps.map((step, i) => (
        <li key={`step_${i}`} className='modern-stack-onboarding--deployment-list-elem'>
          {step}
        </li>
      ));
      return (
        <ul className='modern-stack-onboarding--deployment-list'>
          {stepsMarkup}
        </ul>
      );
    },
    renderNetlifySteps () {
      /* eslint-disable react/jsx-key */
      const steps = [
        <div className='modern-stack-onboarding--deployment-list-text'>
          <A href='https://github.com/netlify/netlifyctl#installation'>
            Install the Netlify CLI
          </A>{' '}
          (This is a free account. You may create an account and login through your CLI).
        </div>,
        this.renderCode('netlifyctl login'),
        this.renderCode('npm run build'),
        this.renderCode('netlifyctl deploy -b public'),
        <p className='modern-stack-onboarding--deployment-list-text'>
          Netlify will ask if you want to create a new website. Select YES to deploy this website.
        </p>
      ];
      /* eslint-enable react/jsx-key */
      return (
        <div className='modern-stack-onboarding--deployment-strategy'>
          <h4 className='modern-stack-onboarding--deployment-strategy-title'>
            <A href='https://www.netlify.com/'>
              Netlify
            </A>
            {' CLI commands'}
          </h4>
          {this.renderList(steps)}
        </div>
      );
    },
    renderHerokuSteps (spaceId, deliveryToken) {
      /* eslint-disable react/jsx-key */
      const steps = [
        <div className='modern-stack-onboarding--deployment-list-text'>
          <A href='https://devcenter.heroku.com/articles/heroku-cli#download-and-install'>
            Install the Heroku CLI
          </A>
          {' (This is a free account. You may create an account and login through your CLI).'}
        </div>,
        this.renderCode('heroku login'),
        this.renderCode('heroku create --buildpack heroku/nodejs'),
        this.renderCode('heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git'),
        this.renderCode(`heroku config:set CONTENTFUL_SPACE_ID=${spaceId} CONTENTFUL_DELIVERY_TOKEN=${deliveryToken}`),
        this.renderCode('git push heroku master')
      ];
      /* eslint-enable react/jsx-key */
      if (!spaceId || !deliveryToken) {
        return (
          <div className='loader__container u-separator--small' style={{background: 'transparent'}}>
            <div className='loading-box__spinner'></div>
            <div className='loader_message'>Loading Heroku deployment steps</div>
          </div>
        );
      } else {
        return (
          <div className='modern-stack-onboarding--deployment-strategy'>
            <h4 className='modern-stack-onboarding--deployment-strategy-title'>
              <A href='https://www.heroku.com/'>
                Heroku
              </A>
              {' CLI commands'}
            </h4>
            {this.renderList(steps)}
          </div>
        );
      }
    },
    render () {
      const { active, deliveryToken, spaceId } = this.state;
      const tabs = [
        {
          id: 'netlify',
          title: 'Netlify',
          content: this.renderNetlifySteps()
        },
        {
          id: 'heroku',
          title: 'Heroku',
          content: this.renderHerokuSteps(spaceId, deliveryToken)
        }
      ];
      return <Tabs tabs={tabs} active={active} onSelect={this.selectTab} />;
    }
  });

  return DeploymentStrategies;
}]);
