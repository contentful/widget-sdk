import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from './Tabs';
import {name as CodeModule} from './Code';

const moduleName = 'deployment-strategies-onboarding';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const Tabs = require(TabsModule);
  const Code = require(CodeModule);

  const DeploymentStrategies = createReactClass({
    getInitialState () {
      return {
        active: 'netlify'
      };
    },
    renderNetlifySteps () {
      return (
        <div>
          {'Netlify CLI commands'}
          <ul>
            <li>
              <a href={''} target={'_blank'}>
                {'Install the Netlify CLI commands'}
              </a>
            </li>
            <li>
              <Code copy code={'netlifyctl login'} />
            </li>
            <li>
              <Code copy code={'npm run build'} />
            </li>
            <li>
              <Code copy code={'netlifyctl deploy -b public'} />
            </li>
          </ul>
        </div>
      );
    },
    renderZeitSteps () {
      return (
        <div>
          {'Zeit CLI commands'}
          <ul>
            <li>
              <Code copy code={'npm install -g now'} />
            </li>
            <li>
              <Code copy code={'now login'} />
            </li>
            <li>
              <Code copy code={'npm run build'} />
            </li>
            <li>
              {'If you have a free plan on Zeit, you need to remove all source maps to keep the size under 1 MB limit:'}
              <Code copy code={'rm public/**/*.js.map'} />
            </li>
            <li>
              <Code copy code={'now --public public'} />
            </li>
          </ul>
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
      return <Tabs tabs={tabs} active={active} />;
    }
  });

  return DeploymentStrategies;
}]);


export const name = moduleName;
