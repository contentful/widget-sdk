import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CodeModule} from '../../../react/atoms/Code';
import {name as IframeHighlightHOCModule} from './IframeHighlightHOC';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'code-snippets-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Code = require(CodeModule);
  const IframeHighlightHOC = require(IframeHighlightHOCModule);
  const { getDeliveryToken } = require(CreateModernOnboardingModule);
  const $stateParams = require('$stateParams');

  const CodeSnippets = createReactClass({
    propTypes: {
      active: PropTypes.string,
      onHover: PropTypes.func,
      onLeave: PropTypes.func
    },
    getInitialState () {
      return {};
    },
    async componentDidMount () {
      const deliveryToken = await getDeliveryToken();
      this.setState({ deliveryToken });
    },
    renderSnippet ({ title, subtitle, code, onHover, onLeave, active }) {
      return (
        <div>
          <h4>{title}</h4>
          {subtitle && <div>{subtitle}</div>}
          <div onMouseEnter={onHover} onMouseLeave={onLeave}>
            <Code
              lineNumbers={false}
              code={code}
              className={active ? 'modern-stack-onboarding--active-code' : ''}
            />
          </div>
        </div>
      );
    },
    renderBootstrapSnippet () {
      const { deliveryToken } = this.state;
      return this.renderSnippet({
        title: 'Bootstrap the Contentful JS SDK',
        code: [
          'import { createClient } from \'contentful\';',
          '',
          'const client = createClient({',
          `  space: '${$stateParams.spaceId}',`,
          `  accessToken: '${deliveryToken || 'loading...'}'`,
          '});'
        ]
      });
    },
    renderPeopleSnippet () {
      const { onHover, onLeave, active } = this.props;
      return this.renderSnippet({
        title: 'Fetch the persons',
        subtitle: 'We filter the data (entries) by the “person” type',
        code: [
          'function getPersons() {',
          '  return client.getEntries({ content_type: \'person\' });',
          '}'
        ],
        onHover: () => onHover('person'),
        onLeave,
        active: active === 'person'
      });
    },
    renderPostsSnippet () {
      const { onHover, onLeave, active } = this.props;
      return this.renderSnippet({
        title: 'Fetch the blog posts that are shown',
        subtitle: 'We filter the data (entries) by the “blogPost” type',
        code: [
          'function getBlogPosts() {',
          '  return client.getEntries({ content_type: \'blogPost\' });',
          '}'
        ],
        onHover: () => onHover('articles'),
        onLeave,
        active: active === 'articles'
      });
    },
    renderAllSnippet () {
      const { onHover, onLeave, active } = this.props;
      return this.renderSnippet({
        title: 'Fetch the blog post “Static sites are great”',
        subtitle: 'We fetch single entry by id',
        code: [
          'const App = ({ author, blogPosts }) => (',
          '  <div>',
          '    <Hero person={author} />',
          '    <div>',
          '      <h2>Recent articles</h2>',
          '      <ul className="article-list">',
          '        {blogPosts.map(post => <ArticlePreview article={post} />)}',
          '      </ul>',
          '    </div>',
          '  </div>',
          ')',
          '',
          'async function renderApp() {',
          '  const [author] = await getAll(\'person\')',
          '  const blogPosts = await getAll(\'blogPost\')',
          '',
          '  ReactDOM.render(',
          '    <App author={author} blogPosts={blogPosts} />,',
          '    document.getElementById(\'root\')',
          '  )',
          '}',
          '',
          'renderApp()',
          '',
          'function getStaticSitesArticle() {',
          '  return client.getEntry(\'3K9b0esdy0q0yGqgW2g6Ke\');',
          '}'
        ],
        onHover: () => onHover('all'),
        onLeave,
        active: active === 'all'
      });
    },
    render () {
      return (
        <div>
          {this.renderBootstrapSnippet()}
          {this.renderPeopleSnippet()}
          {this.renderPostsSnippet()}
          {this.renderAllSnippet()}
        </div>
      );
    }
  });

  return IframeHighlightHOC(CodeSnippets);
}]);
