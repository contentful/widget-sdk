import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from '../../../react/molecules/Tabs';
import {name as CodeModule} from '../../../react/atoms/Code';

export const name = 'deployment-strategies-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Tabs = require(TabsModule);
  const Code = require(CodeModule);

  const DeploymentStrategies = createReactClass({
    getInitialState () {
      return {
        active: 'netlify'
      };
    },
    selectTab (tabId) {
      this.setState({ active: tabId });
    },
    renderCode (code) {
      return <Code lineNumbers={false} copy code={code} />;
    },
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
        <a href={'https://github.com/netlify/netlifyctl#installation'} target={'_blank'}>
          {'Install the Netlify CLI commands'}
        </a>,
        this.renderCode('netlifyctl login'),
        this.renderCode('netlifyctl login'),
        this.renderCode('npm run build'),
        this.renderCode('netlifyctl deploy -b public')
      ];
      /* eslint-enable react/jsx-key */
      return (
        <div className={'modern-stack-onboarding--deployment-strategy'}>
          {'Netlify CLI commands'}
          {this.renderList(steps)}
        </div>
      );
    },
    renderZeitSteps () {
      /* eslint-disable react/jsx-key */
      const steps = [
        this.renderCode('npm install -g now'),
        this.renderCode('now login'),
        this.renderCode('npm run build'),
        <React.Fragment>
          {'If you have a free plan on Zeit, you need to remove all source maps to keep the size under 1 MB limit:'}
          {this.renderCode('rm public/**/*.js.map')}
        </React.Fragment>,
        <a href={'https://github.com/netlify/netlifyctl#installation'} target={'_blank'}>
          {'Install the Netlify CLI commands'}
        </a>,
        this.renderCode('now --public public')
      ];
      /* eslint-enable react/jsx-key */
      return (
        <div className={'modern-stack-onboarding--deployment-strategy'}>
          {'Zeit CLI commands'}
          {this.renderList(steps)}
        </div>
      );
    },
    render () {
      const { active } = this.state;
      const tabs = [
        {
          id: 'netlify',
          title: 'Netlify',
          content: this.renderNetlifySteps()
        },
        {
          id: 'zeit',
          title: 'Zeit (now)',
          content: this.renderZeitSteps()
        }
      ];
      return <Tabs tabs={tabs} active={active} onSelect={this.selectTab} />;
    }
  });

  return DeploymentStrategies;
}]);
