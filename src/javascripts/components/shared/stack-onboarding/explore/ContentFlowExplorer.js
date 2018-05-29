import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from '../../../react/molecules/Tabs';
import {name as CodeSnippetsModule} from './CodeSnippets';
import {name as DataFlowModule} from './DataFlow';

export const name = 'content-flow-explorer';

// TODO: deploy to contentful infrastructure
const GATSBY_APP_URL = 'https://inspiring-goldstine-59b8e7.netlify.com/';

angular.module('contentful')
.factory(name, ['require', function (require) {
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
        active: tabId,
        iframe: null
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
      const { active, iframe } = this.state;

      const snippetsOrder = [
        'person',
        'articles',
        'static-sites-are-great'
      ];

      const dataFlowOrder = [
        'person',
        'articles',
        'static-sites-are-great',
        'hello-world',
        'automate-with-webhooks'
      ];

      const tabs = [
        {
          id: 'code',
          title: 'Code snippets',
          content: this.renderContent(<CodeSnippets iframe={iframe} order={snippetsOrder} />)
        },
        {
          id: 'data-flow',
          title: 'Data model and data flow',
          content: this.renderContent(<DataFlow iframe={iframe} order={dataFlowOrder} />)
        }
      ];

      return <Tabs tabs={tabs} active={active} onSelect={this.selectTab} />;
    },
    renderIframe () {
      const { iframe: stateIframe } = this.state;
      return (
        <iframe
          ref={iframe => {
            if (stateIframe !== iframe) {
              this.setState({ iframe });
            }
          }}
          src={GATSBY_APP_URL}
          className={'modern-stack-onboarding--iframe'}
        />
      );
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
