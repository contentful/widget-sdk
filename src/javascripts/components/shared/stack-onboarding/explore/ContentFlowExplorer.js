import React from 'react';
import createReactClass from 'create-react-class';

import {name as TabsModule} from '../../../react/molecules/Tabs';
import {name as BrowserModule} from '../../../react/molecules/Browser';
import {name as CodeSnippetsModule} from './CodeSnippets';
import {name as DataFlowModule} from './DataFlow';

export const name = 'content-flow-explorer';

// code is located at https://github.com/contentful-userland/gatsby-contentful-starter/tree/ctfl/highlight-entries
// we own the branch, but we don't want to merge it to master (since these changes don't make sense to everyone)
const GATSBY_APP_URL = 'https://ctf-gatsby-contentful-starter.netlify.com/';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Tabs = require(TabsModule);
  const CodeSnippets = require(CodeSnippetsModule);
  const DataFlow = require(DataFlowModule);
  const Browser = require(BrowserModule);

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
        <div className='modern-stack-onboarding--content-explorer'>
          <div className='modern-stack-onboarding--content-explorer-data'>
            {content}
          </div>
          <div className='modern-stack-onboarding--content-explorer-iframe'>
            {this.renderIframe()}
          </div>
        </div>
      );
    },
    renderIframe () {
      const { iframe: stateIframe } = this.state;
      return (
        <Browser>
          <iframe
            sandbox='allow-scripts allow-same-origin'
            ref={iframe => {
              if (stateIframe !== iframe) {
                this.setState({ iframe });
              }
            }}
            src={GATSBY_APP_URL}
            className='modern-stack-onboarding--iframe'
          />
        </Browser>
      );
    },
    render () {
      const { active, iframe } = this.state;

      const tabs = [
        {
          id: 'code',
          title: 'Code snippets',
          content: this.renderContent(<CodeSnippets iframe={iframe} />)
        },
        {
          id: 'data-flow',
          title: 'Data model and data flow',
          content: this.renderContent(<DataFlow iframe={iframe} />)
        }
      ];

      return <Tabs className={'modern-stack-onboarding--content-explorer-tabs'} tabs={tabs} active={active} onSelect={this.selectTab} />;
    }
  });

  return ContentFlowExplorer;
}]);
