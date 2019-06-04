import React from 'react';
import _ from 'lodash';
import * as resources from './DeveloperResources.es6';
import GetSdkSection from './GetSdkSection.es6';
import ExamplesSection from './ExamplesSection.es6';
import DocumentationSection from './DocumentationSection.es6';

const TABS = {
  JAVASCRIPT: 'JavaScript',
  PHP: 'PHP',
  DOTNET: '.NET',
  RUBY: 'Ruby',
  IOS: 'iOS',
  ANDROID: 'Android',
  JAVA: 'Java',
  PYTHON: 'Python'
};

export default class DeveloperResourcesComponent extends React.Component {
  state = {
    selected: TABS.JAVASCRIPT,
    languageResources: resources.developerResources[TABS.JAVASCRIPT]
  };

  selectLanguage = language => {
    this.setState({
      selected: language,
      languageResources: resources.developerResources[language]
    });
  };

  render() {
    const { languageResources, selected } = this.state;

    return (
      <>
        <GetSdkSection selectLanguage={this.selectLanguage} selectedTab={selected} />
        <ExamplesSection selected={selected} languageResources={languageResources} />
        <DocumentationSection
          selected={selected}
          languageResources={languageResources}
          docsUrls={resources.apiDocsUrls}
        />
      </>
    );
  }
}
