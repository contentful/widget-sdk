import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from './Tabs';
import {name as CodeSnippetsModule} from './CodeSnippets';
import {name as DataFlowModule} from './DataFlow';

const moduleName = 'content-flow-explorer';

// TODO: deploy to contentful infrastructure
const GATSBY_APP_URL = 'https://inspiring-goldstine-59b8e7.netlify.com/';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const Tabs = require(TabsModule);
  const CodeSnippets = require(CodeSnippetsModule);
  const DataFlow = require(DataFlowModule);

  const ContentFlowExplorer = createReactClass({
    getInitialState () {
      return {
        active: 'data-flow'
      };
    },
    selectTab (tabId) {
      this.setState({
        active: tabId
      });
    },
    renderContent (content) {
      return (
        <div className={'modern-stack-onboarding--content-explorer-wrapper'}>
          {content}
        </div>
      );
    },
    renderTabs () {
      const { active } = this.state;
      const tabs = [
        {
          id: 'code',
          title: 'Code snippets',
          content: this.renderContent(<CodeSnippets />)
        },
        {
          id: 'data-flow',
          title: 'Data model and data flow',
          content: this.renderContent(<DataFlow />)
        }
      ];

      return <Tabs tabs={tabs} active={active} onSelect={this.selectTab} />;
    },
    renderIframe () {
      return <iframe src={GATSBY_APP_URL} className={'modern-stack-onboarding--iframe'} />;
    },
    render () {
      return (
        <div className={'modern-stack-onboarding--content-explorer'}>
          <div className={'modern-stack-onboarding--content-explorer-data'}>
            {this.renderTabs()}
          </div>
          <div className={'modern-stack-onboarding--content-explorer-iframe'}>
            {this.renderIframe()}
          </div>
        </div>
      );
    }
  });

  return ContentFlowExplorer;
}]);

export const name = moduleName;
