import React from 'react';
import Tabs from 'components/react/molecules/Tabs.es6';
import Browser from 'components/react/molecules/Browser.es6';
import CodeSnippets from 'components/shared/stack-onboarding/explore/CodeSnippets.es6';
import DataFlow from 'components/shared/stack-onboarding/explore/DataFlow.es6';

// code is located at https://github.com/contentful-userland/gatsby-contentful-starter/tree/ctfl/highlight-entries
// we own the branch, but we don't want to merge it to master (since these changes don't make sense to everyone)
const GATSBY_APP_URL = 'https://ctf-gatsby-contentful-starter.netlify.com/';

export default class ContentFlowExplorer extends React.Component {
  state = {
    active: 'code'
  };

  selectTab = tabId => {
    this.setState({
      active: tabId,
      iframe: null
    });
  };

  renderContent = content => {
    return (
      <div className="modern-stack-onboarding--content-explorer">
        <div className="modern-stack-onboarding--content-explorer-data">{content}</div>
        <div className="modern-stack-onboarding--content-explorer-iframe">
          {this.renderIframe()}
        </div>
      </div>
    );
  };

  renderIframe = () => {
    const { iframe: stateIframe } = this.state;
    return (
      <Browser>
        <iframe
          sandbox="allow-scripts allow-same-origin"
          ref={iframe => {
            if (stateIframe !== iframe) {
              this.setState({ iframe });
            }
          }}
          src={GATSBY_APP_URL}
          className="modern-stack-onboarding--iframe"
        />
      </Browser>
    );
  };

  render() {
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

    return (
      <Tabs
        className={'modern-stack-onboarding--content-explorer-tabs'}
        tabs={tabs}
        active={active}
        onSelect={this.selectTab}
      />
    );
  }
}
