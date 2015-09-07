'use strict';

angular.module('contentful').factory('MarkdownEditor/tree', ['$injector', function ($injector) {

  var $sanitize = $injector.get('$sanitize');
  var currentId = 1;

  var TERMINAL_TAGS             = ['br', 'hr'];
  var INLINE_TAGS               = ['strong', 'em', 'del'];
  var HTML_TAGS_RE              = /<\/?[^>]+(>|$)/g;
  var WHITESPACE_RE             = /\s+/g;
  var NEWLINE_ENTITY_RE         = new RegExp('&#10;', 'g');
  var EMBEDLY_CLASS_RE          = new RegExp('class="embedly-card"', 'g');
  var EMBEDLY_CLASS_REPLACEMENT = 'class="embedly-card markdown-block" data-card-controls="0"';

  createTreeBuilder._hash = getHashCode;
  return createTreeBuilder;

  function createTreeBuilder(libs) {
    var MarkedAst  = libs.MarkedAst;
    var AstBuilder = libs.MarkedAst.AstBuilder;
    var React      = libs.React;

    var rootKey   = 'root/' + currentId;
    var conflicts = {};
    var words     = 0;

    currentId += 1;

    return function buildTree(source) {
      var ast = MarkedAst._marked(source, {
        // use renderer with altered methods for links and images
        renderer: new AstBuilder(),
        // turn on Github-flavored MD goodies
        gfm: true,
        tables: true,
        breaks: true,
        smartypants: true,
        // we use $sanitize later on
        sanitize: false
      });

      var result = { root: createRootEl(ast), words: words };
      conflicts = {};
      words = 0;
      return result;
    };

    function buildLevel(level) {
      return _(level || [])
        .map(processItem)
        .filter(notNull)
        .value();
    }

    function processItem(item, i) {
      if ( _.isString(item))      { return createFragmentEl(item);      }
      if (!_.isObject(item))      { return null;                        }
      if (is(item, 'paragraph'))  { return createParagraphEl(item, i);  }
      if (is(item, 'inline'))     { return createInlineEl(item, i);     }
      if (is(item, 'heading'))    { return createHeadingEl(item, i);    }
      if (is(item, 'image'))      { return createImageEl(item, i);      }
      if (is(item, 'link'))       { return createLinkEl(item, i);       }
      if (is(item, 'list'))       { return createListEl(item, i);       }
      if (is(item, 'listitem'))   { return createListItemEl(item, i);   }
      if (is(item, 'terminal'))   { return createTerminalEl(item, i);   }
      if (is(item, 'blockquote')) { return createQuoteEl(item, i);      }
      if (is(item, 'code'))       { return createCodeBlockEl(item, i);  }
      if (is(item, 'codespan'))   { return createCodeSpanEl(item, i);   }
      if (is(item, 'table'))      { return createTableEl(item, i);      }
      if (is(item, 'tablerow'))   { return createTableRowEl(item, i);   }
      if (is(item, 'tablecell'))  { return createTableCellEl(item, i);  }
      if (is(item, 'html'))       { return createHtmlEl(item, i);       }
                                    return null;
    }

    /**
     * Creating elements for AST parts
     */

    function createRootEl(ast) {
      return createReactEl('div', { key: rootKey }, buildLevel(ast));
    }

    function createFragmentEl(item) {
      return createLeafEl('div', item, { className: 'markdown-fragment' });
    }

    function createParagraphEl(item, key) {
      var props = { key: key, className: 'markdown-paragraph markdown-block' };
      return createParentEl('div', props, item.text);
    }

    function createInlineEl(item, key) {
      var props = { key: key, className: 'markdown-fragment' };
      return createParentEl(item.type, props, item.text);
    }

    function createHeadingEl(item, key) {
      var headingType = 'h' + item.level;
      var props       = { key: key, className: 'markdown-heading markdown-block' };
      return createParentEl(headingType, props, item.text);
    }

    function createListEl(item, key) {
      var listType = item.ordered ? 'ol' : 'ul';
      var props    = { key: key, className: 'markdown-list markdown-block' };
      return createParentEl(listType, props, item.body);
    }

    function createListItemEl(item, key) {
      return createParentEl('li', { key: key }, item.text);
    }

    function createImageEl(item, key) {
      var href  = _.isString(item.href) ? (item.href + '?h=200') : null;
      var imgEl = createReactEl('img', { src: href, title: item.title, alt: item.text });
      var props = { key: key, className: 'markdown-image-placeholder markdown-block' };
      return createReactEl('div', props, imgEl);
    }

    function createLinkEl(item, key) {
      /*jshint scripturl:true*/
      var isSafe  = _.isString(item.href) && item.href.substr(0, 11) !== 'javascript:';
      var props   = { key: key, href: isSafe ? item.href : null, title: item.title, target: '_blank' };
      return createParentEl('a', props, item.text);
    }

    function createTerminalEl(item, key) {
      return createReactEl(item.type, { key: key });
    }

    function createQuoteEl(item, key) {
      var props = { key: key, className: 'markdown-quote markdown-block' };
      return createParentEl('blockquote', props, item.quote);
    }

    function createCodeBlockEl(item, key) {
      var codeEl = createReactEl('code', null, item.code);
      var props  = { key: key, className: 'markdown-code markdown-block' };
      return createReactEl('pre', props, codeEl);
    }

    function createCodeSpanEl(item, key) {
      var props = { key: key, className: 'markdown-fragment' };
      return createParentEl('code', props, item.text);
    }

    function createTableEl(item, key) {
      var headerEl = createReactEl('thead', { key: 'table/head/' + key }, buildLevel(item.header));
      var bodyEl   = createReactEl('tbody', { key: 'table/body/' + key }, buildLevel(item.body));
      var props    = { key: key, className: 'markdown-table markdown-block' };
      return createReactEl('table', props, [headerEl, bodyEl]);
    }

    function createTableCellEl(item, key) {
      var cellType = item.flags.header ? 'th' : 'td';
      return createParentEl(cellType, { key: key }, item.content);
    }

    function createTableRowEl(item, key) {
      return createParentEl('tr', { key: key }, item.content);
    }

    function createHtmlEl(item, key) {
      var props = { key: key, className: 'markdown-html markdown-block' };
      var html  = _.reduce(item.html, accStrings, '');
      return createLeafEl('div', html, props);
    }

    /**
     * Low-level React DOM functions
     */

    function createLeafEl(tag, html, props) {
      var isClean = html.indexOf('<') < 0;

      if (!isClean    ) { html = sanitize(html); }
      if (!html.length) { return null;           }

      words += countWords(html, isClean);
      props = _.extend(props || {}, {
        dangerouslySetInnerHTML: { __html: html },
        key: getKey(html, tag)
      });

      return createReactEl(tag, props);
    }

    function createParentEl(tag, props, children) {
      children = prepareChildren(children);
      children = mergeTextNodes(children);

      if (_.every(children, _.isString)) {
        return createLeafEl(tag, children.join(''), props);
      } else {
        return createReactEl(tag, props, buildLevel(children));
      }
    }

    function createReactEl(tag, props, children) {
      var args = [tag, props].concat(prepareChildren(children));
      return React.createElement.apply(React, args);
    }

    // using string hashing to get unique keys for React
    function getKey(str, tag) {
      var hash = getHashCode(str);
      var conflictCount = conflicts[hash];
      var key = 'html/' + tag + '/' + hash;

      if (conflictCount) {
        key += '/' + conflictCount;
      } else {
        conflicts[hash] = 0;
      }
      conflicts[hash] += 1;

      return key;
    }
  }

  /**
   * Context-free utilities
   */

  function is(item, type) {
    return (
      (item.type === type) ||
      (type === 'terminal' && TERMINAL_TAGS.indexOf(item.type) > -1) ||
      (type === 'inline'   && INLINE_TAGS.indexOf(item.type)   > -1)
    );
  }

  function prepareChildren(nodes) {
    nodes = nodes || [];
    nodes = _.isArray(nodes) ? nodes : [nodes];

    return nodes;
  }

  function sanitize(html) {
    html = $sanitize(html);
    html = html.replace(NEWLINE_ENTITY_RE, '\n');
    html = html.replace(EMBEDLY_CLASS_RE, EMBEDLY_CLASS_REPLACEMENT);

    return html;
  }

  function countWords(html, isClean) {
    var clean = isClean ? html : html.replace(HTML_TAGS_RE, '');
    clean = _.isString(clean) ? clean : '';
    var words = clean.replace(WHITESPACE_RE, ' ').split(' ');

    return _.filter(words, notEmpty).length;
  }

  function mergeTextNodes(nodes) {
    var merged = [];
    var i, node, last;

    for (i = 0; i < nodes.length; i += 1) {
      node = nodes[i];
      last = merged.length - 1;
      last = last >= 0 ? last : 0;

      if (!_.isString(node)) {
        merged.push(node);
      }
      else if (merged.length < 1 || !_.isString(merged[last])) {
        merged.push(node);
      }
      else if (_.isString(merged[last]) && _.isString(node)) {
        merged[last] += node;
      }
    }

    return merged;
  }

  // DJB2 hashing algorithm
  function getHashCode(str) {
    return _.reduce(str.split(''), function (a, b) {
      return ((a << 5) + a) + b.charCodeAt(0);
    }, 5381);
  }

  function notNull(x)         { return !_.isNull(x);                    }
  function notEmpty(x)        { return x.length > 0;                    }
  function accStrings(acc, x) { return _.isString(x) ? (acc + x) : acc; }
}]);
