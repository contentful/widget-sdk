'use strict';

var hljs = require('highlight.js');

/**
 * Custom tags for nunjuck templates
 *
 * ## `codeblock`
 *
 * Highlights the code and puts it into <code> tag.
 *
 *     {% codeblock "javascript" %}
 *       $('body').click(alert))
 *     {% endcode %}
 */
module.exports = function templateTags (trimIndentation) {
  return [{
    tags: ['codeblock'],
    parse: function(parser, nodes) {
      var tok = parser.nextToken();
      var args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(tok.value);

      var content = parser.parseUntilBlocks('endcode');
      var tag = new nodes.CallExtension(this, 'process', args, [content]);
      parser.advanceAfterBlockEnd();

      return tag;
    },

    process: function(context, lang, content) {
      if ( !content ) {
        content = lang;
        lang = undefined;
      }
      var codeString;
      content = trimIndentation(content());
      if (lang)
        codeString = hljs.highlight(lang, content).value;
      else
        codeString = hljs.highlightAuto(content).value;
      return '<code class="code-block hljs"><pre>' + codeString + '</pre></code>';
    }
  }];
};
