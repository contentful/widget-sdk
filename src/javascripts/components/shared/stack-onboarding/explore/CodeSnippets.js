import React from 'react';
import PropTypes from 'prop-types';

import { name as CodeModule } from '../../../react/atoms/Code';
import { name as IframeHighlightHOCModule } from './IframeHighlightHOC';
import { name as CreateModernOnboardingModule } from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'code-snippets-component';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const Code = require(CodeModule);
    const IframeHighlightHOC = require(IframeHighlightHOCModule);
    const { getDeliveryToken } = require(CreateModernOnboardingModule);
    const $stateParams = require('$stateParams');

    class CodeSnippets extends React.Component {
      static propTypes = {
        active: PropTypes.string,
        onHover: PropTypes.func,
        onLeave: PropTypes.func
      };

      state = {};

      async componentDidMount() {
        const deliveryToken = await getDeliveryToken();
        this.setState({ deliveryToken });
      }

      renderSnippet = ({ title, subtitle, code, onHover, onLeave, active }) => {
        return (
          <div>
            <h4 className={'modern-stack-onboarding--code-title'}>{title}</h4>
            {subtitle && <div className={'modern-stack-onboarding--code-subtitle'}>{subtitle}</div>}
            <div
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
              className={'modern-stack-onboarding--code-wrapper'}>
              <Code
                lineNumbers={false}
                code={code}
                className={'modern-stack-onboarding--code-block'}
              />
              {active && <div className={'modern-stack-onboarding--active-data'} />}
            </div>
          </div>
        );
      };

      renderBootstrapSnippet = () => {
        const { deliveryToken } = this.state;
        return this.renderSnippet({
          title: 'Bootstrap the Contentful JS SDK',
          code: [
            "import contentful from 'contentful'",
            '',
            'const client = contentful.createClient({',
            `  space: '${$stateParams.spaceId}',`,
            `  accessToken: '${deliveryToken || 'loading...'}'`,
            '})'
          ]
        });
      };

      renderPeopleSnippet = () => {
        const { onHover, onLeave, active } = this.props;
        return this.renderSnippet({
          title: 'Fetch all people',
          subtitle:
            'We filter and fetch the data (entries) in your space by the “person” content type.',
          code: [
            'async function getPeople() {',
            "  const entries = await client.getEntries({ content_type: 'person' })",
            '  return entries.items',
            '}'
          ],
          onHover: () => onHover('person'),
          onLeave,
          active: active === 'person'
        });
      };

      renderPostsSnippet = () => {
        const { onHover, onLeave, active } = this.props;
        return this.renderSnippet({
          title: 'Fetch all blog posts',
          subtitle:
            'We filter and fetch the data (entries) in your space by the “blogPost” content type.',
          code: [
            'async function getBlogPosts() {',
            "  const entries = await client.getEntries({ content_type: 'blogPost' })",
            '  return entries.items',
            '}'
          ],
          onHover: () => onHover('articles'),
          onLeave,
          active: active === 'articles'
        });
      };

      renderAllSnippet = () => {
        const { onHover, onLeave, active } = this.props;
        return this.renderSnippet({
          title: 'Put it all together',
          subtitle: 'We use the data from your Contentful space to render the interface.',
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
            '  const [author] = await getPeople()',
            '  const blogPosts = await getBlogPosts()',
            '',
            '  ReactDOM.render(',
            '    <App author={author} blogPosts={blogPosts} />,',
            "    document.getElementById('root')",
            '  )',
            '}',
            '',
            'renderApp()'
          ],
          onHover: () => onHover('all'),
          onLeave,
          active: active === 'all'
        });
      };

      render() {
        return (
          <div>
            {this.renderBootstrapSnippet()}
            {this.renderPeopleSnippet()}
            {this.renderPostsSnippet()}
            {this.renderAllSnippet()}
          </div>
        );
      }
    }

    return IframeHighlightHOC(CodeSnippets);
  }
]);
