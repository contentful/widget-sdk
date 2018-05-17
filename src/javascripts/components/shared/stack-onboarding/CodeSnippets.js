import React from 'react';
import createReactClass from 'create-react-class';

import {name as CodeModule} from './Code';

const moduleName = 'code-snippets-component';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const Code = require(CodeModule);

  const CodeSnippets = createReactClass({
    renderSnippet ({ title, subtitle, code }) {
      return (
        <div>
          <h4>{title}</h4>
          {subtitle && <div>{subtitle}</div>}
          <Code lineNumbers={false} code={code} />
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
      return this.renderSnippet({
        title: 'Fetch the persons',
        subtitle: 'We filter the data (entries) by the “person” type',
        code: [
          'function getPersons() {',
          '  return client.getEntries({ content_type: \'person\' });',
          '}'
        ]
      });
    },
    renderPostsSnippet () {
      return this.renderSnippet({
        title: 'Fetch the blog posts that are shown',
        subtitle: 'We filter the data (entries) by the “blogPost” type',
        code: [
          'function getBlogPosts() {',
          '  return client.getEntries({ content_type: \'blogPost\' });',
          '}'
        ]
      });
    },
    renderSinglePostSnippet () {
      return this.renderSnippet({
        title: 'Fetch the blog post “Static sites are great”',
        subtitle: 'We fetch single entry by id',
        code: [
          'function getStaticSitesArticle() {',
          '  return client.getEntry(\'3K9b0esdy0q0yGqgW2g6Ke\');',
          '}'
        ]
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

  return CodeSnippets;
}]);


export const name = moduleName;
