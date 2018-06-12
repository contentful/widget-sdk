import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from '../../../react/molecules/Tabs';
import {name as CodeModule} from '../../../react/atoms/Code';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'deployment-strategies-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Tabs = require(TabsModule);
  const Code = require(CodeModule);
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
    renderCode: (code) => <Code lineNumbers={false} copy code={code} />,
    renderList (steps) {
      const stepsMarkup = steps.map((step, i) => (
        <li key={`step_${i}`} className={'modern-stack-onboarding--deployment-list-elem'}>
          {step}
        </li>
      ));
      return (
        <ul className={'modern-stack-onboarding--deployment-list'}>
          {stepsMarkup}
        </ul>
      );
    },
    renderNetlifySteps () {
      /* eslint-disable react/jsx-key */
      const steps = [
        <React.Fragment>
          <a
            href={'https://github.com/netlify/netlifyctl#installation'}
            target={'_blank'}
            style={{display: 'inline-block', marginBottom: '1.1em'}}
          >
            {'Install the Netlify CLI'}
          </a>
          <span style={{marginLeft: '10px'}}>(This is a free account. You may create an account and login through your CLI)</span>
        </React.Fragment>,
        this.renderCode('netlifyctl login'),
        this.renderCode('npm run build'),
        this.renderCode('netlifyctl deploy -b public'),
        <p style={{marginTop: '2.6em', fontWeight: 'bold'}}>
          Netlify will ask if you want to create a new website. Select YES to deploy this website.
        </p>
      ];
      /* eslint-enable react/jsx-key */
      return (
        <div className={'modern-stack-onboarding--deployment-strategy'}>
          {'Netlify CLI commands'}
          {this.renderList(steps)}
        </div>
      );
    },
    renderHerokuSteps (spaceId, deliveryToken) {
      /* eslint-disable react/jsx-key */
      const steps = [
        <React.Fragment>
          <a
            href={'https://devcenter.heroku.com/articles/heroku-cli#download-and-install'}
            target={'_blank'}
            style={{display: 'inline-block', marginBottom: '1.1em'}}
          >
            {'Install the Heroku CLI'}
          </a>
          <span style={{marginLeft: '10px'}}>(This is a free account. You may create an account and login through your CLI).</span>
        </React.Fragment>,
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
          <div className={'modern-stack-onboarding--deployment-strategy'}>
            {'Heroku CLI commands'}
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
