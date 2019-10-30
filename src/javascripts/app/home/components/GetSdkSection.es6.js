import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Tabs,
  Tab,
  TabPanel,
  TextLink,
  Paragraph,
  Heading
} from '@contentful/forma-36-react-components';

const TABS = {
  JAVASCRIPT: 'Javascript',
  PHP: 'PHP',
  DOTNET: '.NET',
  RUBY: 'Ruby',
  IOS: 'iOS',
  ANDROID: 'Android',
  JAVA: 'Java',
  PYTHON: 'Python'
};

const styles = {
  sdkPanel: css({ marginTop: '16px' }),
  tabList: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    margin: ' 0 1px 16px 1px',
    width: '100%',
    transition: 'background-color 0.2s ease-in-out',
    zIndex: 1
  }),
  section: css({
    width: '100%',
    position: 'relative',
    backgroundColor: 'white',
    border: `1px solid ${tokens.colorElementMid}`,
    display: 'block',
    padding: tokens.spacingXl
  }),
  heading: css({ fontSize: tokens.fontSizeL }),
  description: css({ marginTop: 0, lineHeight: '1.5em' }),
  codeBlock: {
    block: css({
      lineHeight: 0,
      counterReset: 'line',
      color: tokens.colorTextMid,
      position: 'relative',
      border: `1px solid ${tokens.colorElementMid}`,
      backgroundColor: tokens.colorElementLightest,
      padding: '8px 0',
      whiteSpace: 'pre',
      overflowX: 'auto',
      flexGrow: 1,
      flexBasis: '100%',
      marginTop: tokens.spacingM,
      overflow: 'visible;'
    }),
    language: css({
      position: 'absolute',
      fontSize: '10px',
      textTransform: 'uppercase',
      border: `1px solid ${tokens.colorElementMid}`,
      right: '-1px',
      top: '-1.5rem',
      height: tokens.spacingL,
      lineHeight: '1.5rem',
      padding: '0 4px',
      letterSpacing: '1px',
      backgroundColor: tokens.colorElementLightest,
      color: tokens.colorTextLight
    }),
    line: css({
      fontFamily: 'monospace',
      color: tokens.colorTextLight,
      display: 'block',
      lineHeight: '0.6rem',
      paddingRight: '2em',
      '&:before': {
        userSelect: 'none',
        counterIncrement: 'line',
        content: 'counter(line)',
        display: 'inline-block',
        borderRight: `1px solid ${tokens.colorElementMid}`,
        padding: '.5em 1em',
        marginRight: '.7em',
        fontWeight: 'bold',
        color: tokens.colorTextLightest
      }
    }),
    s1: css({ color: tokens.colorRedMid }),
    s2: css({ color: tokens.colorGreenDark })
  }
};

const GetSdkSection = () => {
  const [language, setLanguage] = useState(TABS.JAVASCRIPT);
  return (
    <div id="get-sdk-section">
      <Tabs role="tablist" className={styles.tabList}>
        <Tab
          id="javascript"
          selected={language === TABS.JAVASCRIPT}
          onSelect={() => setLanguage(TABS.JAVASCRIPT)}>
          JavaScript
        </Tab>
        <Tab id="php" selected={language === TABS.PHP} onSelect={() => setLanguage(TABS.PHP)}>
          PHP
        </Tab>
        <Tab
          id="dot_net"
          selected={language === TABS.DOTNET}
          onSelect={() => setLanguage(TABS.DOTNET)}>
          .NET
        </Tab>
        <Tab id="ruby" selected={language === TABS.RUBY} onSelect={() => setLanguage(TABS.RUBY)}>
          Ruby
        </Tab>
        <Tab id="ios" selected={language === TABS.IOS} onSelect={() => setLanguage(TABS.IOS)}>
          iOS
        </Tab>
        <Tab
          id="android"
          selected={language === TABS.ANDROID}
          onSelect={() => setLanguage(TABS.ANDROID)}>
          Android
        </Tab>
        <Tab id="java" selected={language === TABS.JAVA} onSelect={() => setLanguage(TABS.JAVA)}>
          Java
        </Tab>
        <Tab
          id="python"
          selected={language === TABS.PYTHON}
          onSelect={() => setLanguage(TABS.PYTHON)}>
          Python
        </Tab>
      </Tabs>
      <TabPanel className={styles.sdkPanel} id={`${language}-developer-resources`}>
        <SelectedLanguage language={language} />
      </TabPanel>
    </div>
  );
};

export default GetSdkSection;

const SelectedLanguage = ({ language }) => {
  switch (language) {
    case TABS.PHP:
      return (
        <LanguageSection
          sdkDocsLink={'https://contentful.github.io/contentful.php/api/'}
          githubLink={'https://github.com/contentful/contentful.php'}
          description={'Get the PHP SDK and use it in your project:'}
          codeBlockContent={
            <div>
              <div className={styles.codeBlock.language}>bash</div>
              <div className={styles.codeBlock.line}>php composer.phar contentful/contentful</div>
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
              <div className={styles.codeBlock.language}>bash</div>
              <div className={styles.codeBlock.line}>Install-Package contentful.csharp</div>
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
              <div className={styles.codeBlock.language}>ruby</div>
              <div className={styles.codeBlock.line}>
                gem <span className={styles.codeBlock.s1}>contentful</span>
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
              <div className={styles.codeBlock.language}>ruby</div>
              <div className={styles.codeBlock.line}>
                platform <span className={styles.codeBlock.s2}>:ios</span>,{' '}
                <span className={styles.codeBlock.s1}>{'9.0'}</span>
              </div>
              <div className={styles.codeBlock.line}>use_frameworks!</div>
              <div className={styles.codeBlock.line}>
                pod <span className={styles.codeBlock.s1}>Contentful</span>
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
              <div className={styles.codeBlock.language}>groovy</div>
              <div className={styles.codeBlock.line}>
                compile{' '}
                <span className={styles.codeBlock.s1}>{'com.contentful.java:java-sdk:+'}</span>
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
              <div className={styles.codeBlock.language}>xml</div>
              <div className={styles.codeBlock.line}>
                &lt;<span className={styles.codeBlock.s2}>dependency</span>&gt;
              </div>
              <div className={styles.codeBlock.line}>
                &nbsp;&nbsp;&lt;<span className={styles.codeBlock.s2}>groupId</span>
                &gt;com.contentful.java&lt;/
                <span className={styles.codeBlock.s2}>groupId</span>&gt;
              </div>
              <div className={styles.codeBlock.line}>
                &nbsp;&nbsp;&lt;<span className={styles.codeBlock.s2}>artifactId</span>
                &gt;java-sdk&lt;/
                <span className={styles.codeBlock.s2}>artifactId</span>&gt;
              </div>
              <div className={styles.codeBlock.line}>
                &nbsp;&nbsp;&lt;<span className={styles.codeBlock.s2}>version</span>&gt;10.0.0&lt;/
                <span className={styles.codeBlock.s2}>version</span>&gt;
              </div>
              <div className={styles.codeBlock.line}>
                &lt;/<span className={styles.codeBlock.s2}>dependency</span>&gt;
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
              <div className={styles.codeBlock.language}>bash</div>
              <div className={styles.codeBlock.line}>pip install contentful</div>
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
              <div className={styles.codeBlock.language}>bash</div>
              <div className={styles.codeBlock.line}>npm install contentful</div>
            </div>
          }
        />
      );
  }
};

SelectedLanguage.propTypes = {
  language: PropTypes.any.isRequired
};

const LanguageSection = ({ sdkDocsLink, githubLink, description, codeBlockContent }) => {
  return (
    <section className={styles.section}>
      <Heading className={styles.heading}>Get the SDK</Heading>
      <div className={cx('f36-margin-top--2xs', 'f36-margin-bottom--s', 'separated-links')}>
        <TextLink href={sdkDocsLink} target="_blank" rel="noopener noreferrer">
          SDK documentation{' '}
        </TextLink>
        <TextLink href={githubLink} target="_blank" rel="noopener noreferrer">
          {' '}
          View on GitHub
        </TextLink>
      </div>
      <Paragraph className={styles.description}>{description}</Paragraph>
      <div className={styles.codeBlock.block}>{codeBlockContent}</div>
    </section>
  );
};

LanguageSection.propTypes = {
  sdkDocsLink: PropTypes.string.isRequired,
  githubLink: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  codeBlockContent: PropTypes.node.isRequired
};
