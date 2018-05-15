import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from './Tabs';
import {name as CodeSnippetsModule} from './CodeSnippets';
import {name as DataFlowModule} from './DataFlow';

const moduleName = 'content-flow-explorer';

// TODO: move to the config
const GATSBY_APP_URL = 'http://localhost:8000';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const Tabs = require(TabsModule);
  const CodeSnippets = require(CodeSnippetsModule);
  const DataFlow = require(DataFlowModule);

  const ContentFlowExplorer = createReactClass({
    getInitialState () {
      return {
        active: 'code'
      };
    },
    selectTab (tabId) {
      this.setState({
        active: tabId
      });
    },
    renderTabs () {
      const { active } = this.state;
      const tabs = [
        {
          id: 'code',
          title: 'Code snippets',
          content: <CodeSnippets />
        },
        {
          id: 'data-flow',
          title: 'Data model and data flow',
          content: <DataFlow />
        }
      ];

      return <Tabs tabs={tabs} active={active} onSelect={this.selectTab} />;
    },
    renderIframe () {
      return (
        <div>
          <iframe src={GATSBY_APP_URL} />
        </div>
      );
    },
    render () {
      return (
        <div>
          {this.renderTabs()}
          {this.renderIframe()}
        </div>
      );
    }
  });

  return ContentFlowExplorer;
}]);

export const name = moduleName;
