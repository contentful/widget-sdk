import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';

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

const styles = { sdkPanel: css({ marginTop: '16px' }) };

const GetSdkSection = ({ selectedTab, selectLanguage }) => {
  return (
    <div id="get-sdk-section">
      <Tabs role="tablist" className={'tab-list x--home'}>
        <Tab
          id="javascript"
          selected={selectedTab === TABS.JAVASCRIPT}
          onSelect={() => selectLanguage(TABS.JAVASCRIPT)}>
          JavaScript
        </Tab>
        <Tab id="php" selected={selectedTab === TABS.PHP} onSelect={() => selectLanguage(TABS.PHP)}>
          PHP
        </Tab>
        <Tab
          id="dot_net"
          selected={selectedTab === TABS.DOTNET}
          onSelect={() => selectLanguage(TABS.DOTNET)}>
          .NET
        </Tab>
        <Tab
          id="ruby"
          selected={selectedTab === TABS.RUBY}
          onSelect={() => selectLanguage(TABS.RUBY)}>
          Ruby
        </Tab>
        <Tab id="ios" selected={selectedTab === TABS.IOS} onSelect={() => selectLanguage(TABS.IOS)}>
          iOS
        </Tab>
        <Tab
          id="android"
          selected={selectedTab === TABS.ANDROID}
          onSelect={() => selectLanguage(TABS.ANDROID)}>
          Android
        </Tab>
        <Tab
          id="java"
          selected={selectedTab === TABS.JAVA}
          onSelect={() => selectLanguage(TABS.JAVA)}>
          Java
        </Tab>
        <Tab
          id="python"
          selected={selectedTab === TABS.PYTHON}
          onSelect={() => selectLanguage(TABS.PYTHON)}>
          Python
        </Tab>
      </Tabs>
      <TabPanel className={styles.sdkPanel} id={`${selectedTab}-developer-resources`}>
        <SelectedLanguage selectedTab={selectedTab} />
      </TabPanel>
    </div>
  );
};

GetSdkSection.propTypes = {
  selectedTab: PropTypes.string.isRequired,
  selectLanguage: PropTypes.func.isRequired
};

export default GetSdkSection;

const SelectedLanguage = ({ selectedTab }) => {
  switch (selectedTab) {
    case TABS.PHP:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.php/api/'}
          githubLink={'https://github.com/contentful/contentful.php'}
          description={'Get the PHP SDK and use it in your project:'}
          codeBlockContent={
            <div>
              <div className="code-block__language">bash</div>
              <div className="code-block__line">php composer.phar contentful/contentful</div>
            </div>
          }
        />
      );
    case TABS.DOTNET:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.net-docs/api/index.html'}
          githubLink={'https://github.com/contentful/contentful.net'}
          description={
            'Get the .NET SDK and use it in your project by using the following command in your NuGet package manager console:'
          }
          codeBlockContent={
            <div>
              <div className="code-block__language">bash</div>
              <div className="code-block__line">Install-Package contentful.csharp</div>
            </div>
          }
        />
      );
    case TABS.RUBY:
      return (
        <LanguageSection
          sdkDocsLink={'http://www.rubydoc.info/gems/contentful/'}
          githubLink={'https://github.com/contentful/contentful.rb'}
          description={
            <>
              Get the Ruby SDK and use it in your project by adding the following to your{' '}
              <em>Gemfile</em>:
            </>
          }
          codeBlockContent={
            <div>
              <div className="code-block__language">ruby</div>
              <div className="code-block__line">
                gem <span className="s1">{'contentful'}</span>
              </div>
            </div>
          }
        />
      );
    case TABS.IOS:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.swift/docs/index.html'}
          githubLink={'https://github.com/contentful/contentful.swift'}
          description={
            <>
              Get the Swift SDK and use it in your project by adding the following to your{' '}
              <em>Podfile</em>:
            </>
          }
          codeBlockContent={
            <div>
              <div className="code-block__language">ruby</div>
              <div className="code-block__line">
                platform <span className="s2">:ios</span>, <span className="s1">{'9.0'}</span>
              </div>
              <div className="code-block__line">use_frameworks!</div>
              <div className="code-block__line">
                pod <span className="s1">{'Contentful'}</span>
              </div>
            </div>
          }
        />
      );
    case TABS.ANDROID:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.java/'}
          githubLink={'https://github.com/contentful/contentful.java'}
          description={
            <>
              Get the Java SDK and use it in your Android project by adding the following to your{' '}
              <em>build.gradle</em> file:
            </>
          }
          codeBlockContent={
            <div>
              <div className="code-block__language">groovy</div>
              <div className="code-block__line">
                compile <span className="s1">{'com.contentful.java:java-sdk:+'}</span>
              </div>
            </div>
          }
        />
      );
    case TABS.JAVA:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.java/'}
          githubLink={'https://github.com/contentful/contentful.java'}
          description={
            <>
              Get the Java SDK and use it in your project by adding the following to your{' '}
              <em>pom.xml</em> file:
            </>
          }
          codeBlockContent={
            <div>
              <div className="code-block__language">xml</div>
              <div className="code-block__line">
                &lt;<span className="s2">dependency</span>&gt;
              </div>
              <div className="code-block__line">
                &nbsp;&nbsp;&lt;<span className="s2">groupId</span>&gt;com.contentful.java&lt;/
                <span className="s2">groupId</span>&gt;
              </div>
              <div className="code-block__line">
                &nbsp;&nbsp;&lt;<span className="s2">artifactId</span>&gt;java-sdk&lt;/
                <span className="s2">artifactId</span>&gt;
              </div>
              <div className="code-block__line">
                &nbsp;&nbsp;&lt;<span className="s2">version</span>&gt;10.0.0&lt;/
                <span className="s2">version</span>&gt;
              </div>
              <div className="code-block__line">
                &lt;/<span className="s2">dependency</span>&gt;
              </div>
            </div>
          }
        />
      );
    case TABS.PYTHON:
      return (
        <LanguageSection
          sdkDocsLink={'https://github.com/contentful/contentful.py/blob/master/README.rst'}
          githubLink={'https://github.com/contentful/contentful.py'}
          description={'Get the Python SDK and use it in your project:'}
          codeBlockContent={
            <div>
              <div className="code-block__language">groovy</div>
              <div className="code-block__line">
                compile <span className="s1">{'com.contentful.java:java-sdk:+'}</span>
              </div>
            </div>
          }
        />
      );
    default:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.js'}
          githubLink={'https://github.com/contentful/contentful.js'}
          description={'Get the JavaScript SDK and use it in your project:'}
          codeBlockContent={
            <div>
              <div className="code-block__language">bash</div>
              <div className="code-block__line">npm install contentful</div>
            </div>
          }
        />
      );
  }
};

SelectedLanguage.propTypes = {
  selectedTab: PropTypes.any.isRequired
};

const LanguageSection = ({ sdkDocsLink, githubLink, description, codeBlockContent }) => {
  return (
    <section className="home-section" cf-track-copy-event="cf-track-copy-event">
      <h3 className="home-section__heading">Get the SDK</h3>
      <div className="separated-links">
        <a href={sdkDocsLink} target="_blank" rel="noopener noreferrer">
          SDK documentation
        </a>
        <a href={githubLink} target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </div>
      <p className="home-section__description">{description}</p>
      <div className="code-block">{codeBlockContent}</div>
    </section>
  );
};

LanguageSection.propTypes = {
  sdkDocsLink: PropTypes.string.isRequired,
  githubLink: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  codeBlockContent: PropTypes.node.isRequired
};
