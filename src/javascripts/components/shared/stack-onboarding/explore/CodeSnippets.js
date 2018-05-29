import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CodeModule} from '../../../react/atoms/Code';
import {name as IframeHighlightHOCModule} from './IframeHighlightHOC';

export const name = 'code-snippets-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const Code = require(CodeModule);
  const IframeHighlightHOC = require(IframeHighlightHOCModule);

  const CodeSnippets = createReactClass({
    propTypes: {
      active: PropTypes.string,
      onHover: PropTypes.func,
      onLeave: PropTypes.func
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
      return this.renderSnippet({
        title: 'Bootstrap the Contentful JS SDK',
        code: [
          'import { createClient } from \'contentful\';',
          '',
          'const client = createClient({',
          '  space: \'knkpgpuap43s\',',
          '  accessToken: \'3f8bd90ee4211c1eb9c632357130889938814e75dc3454b2809ee0b3b64fa2e9\'',
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
    renderSinglePostSnippet () {
      const { onHover, onLeave, active } = this.props;
      return this.renderSnippet({
        title: 'Fetch the blog post “Static sites are great”',
        subtitle: 'We fetch single entry by id',
        code: [
          'function getStaticSitesArticle() {',
          '  return client.getEntry(\'3K9b0esdy0q0yGqgW2g6Ke\');',
          '}'
        ],
        onHover: () => onHover('static-sites-are-great'),
        onLeave,
        active: active === 'static-sites-are-great'
      });
    },
    render () {
      return (
        <div>
          {this.renderBootstrapSnippet()}
          {this.renderPeopleSnippet()}
          {this.renderPostsSnippet()}
          {this.renderSinglePostSnippet()}
        </div>
      );
    }
  });

  return IframeHighlightHOC(CodeSnippets);
}]);
