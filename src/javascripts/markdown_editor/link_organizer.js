'use strict';

angular.module('contentful').factory('LinkOrganizer', ['require', function (require) {

  var PROCESSORS = require('LinkOrganizer/matchProcessors');
  var REGEXS     = {
    inline: /\[([^\r\n\[\]]+)]\(([^\r\n\)]+)\)/,
    ref:    /\[([^\r\n\[\]]+)] ?\[([^\r\n\[\]]+)]/,
    label:  /^ {0,3}\[([^\r\n\[\]]+)]:\s+(.+)$/
  };
  var findInline = makeFinder('inline');
  var findRefs   = makeFinder('ref');
  var findLabels = makeFinder('label');

  return {
    convertInlineToRef: convertInlineToRef,
    mergeLabels:        mergeLabels,
    rewriteRefs:        rewriteRefs,
    findInline:         findInline,
    findRefs:           findRefs,
    findLabels:         findLabels,
    findMaxLabelId:     findMaxLabelId
  };

  function convertInlineToRef(text) {
    var id = findMaxLabelId(text) ;

    _.forEach(findInline(text), function (inline) {
      id += 1;
      text = text.replace(inline.match, buildRef(inline, id));
      text += '\n' + buildLabel(inline, id);
    });

    return text;
  }

  function mergeLabels(text) {
    var byHref = {};
    var byOldId = {};

    _.forEach(findLabels(text), function (label) {
      var alreadyAdded = byHref[label.href];
      var current = _.extend({}, label);

      if (!alreadyAdded) {
        byHref[current.href] = current;
      } else if (hasTitle(current) && !hasTitle(alreadyAdded)) {
        alreadyAdded.title = current.title;
      }

      byOldId[current.id] = alreadyAdded || current;
    });

    return {
      byHref:  byHref,
      byOldId: byOldId
    };
  }

  function rewriteRefs(text) {
    var merged = mergeLabels(text);
    var hrefToRefId = {};
    var labels = [];
    var rewrites = [];
    var i = 1;

    // 1. compose list of labels with new ids, in order
    _.forEach(findRefs(text), function (ref) {
      var oldLabel = merged.byOldId[ref.id];
      if (!oldLabel) { return; }
      var href = oldLabel.href;
      var newRefId = hrefToRefId[href];

      if (!newRefId) {
        hrefToRefId[href] = newRefId = i;
        i += 1;
        labels.push(_.extend({ newId: newRefId }, oldLabel));
      }

      // 1b. prepare rewrites to be applied, with new label ids
      rewrites.push(_.extend({ newId: newRefId }, ref));
    });

    // 2. remove all labels!
    _.forEach(findLabels(text), function (label) {
      text = text.replace(label.match, '');
    });

    // 3. remove whitespace from the end of text
    text = text.replace(/[\r\n\s]*$/, '');
    text += '\n\n';

    // 4. apply rewrites
    _.forEach(rewrites, function (ref) {
      text = text.replace(ref.match, buildRef(ref, ref.newId));
    });

    // 5. print new labels at the end of text
    _.forEach(labels, function (label) {
      text += '\n' + buildLabel(label, label.newId);
    });

    return text;
  }

  /**
   * Finding stuff
   */

  function makeFinder(type) {
    return function (text) {
      return _.map(findAll(text, type), PROCESSORS[type]);
    };
  }

  function findMaxLabelId(textOrLabels) {
    if (_.isString(textOrLabels)) {
      textOrLabels = findLabels(textOrLabels);
    }

    var ids = _(textOrLabels).map('id')
      .map(function (x) { return parseInt(x, 10); })
      .filter(function (x) { return _.isFinite(x) && x > 0; })
      .value();

    return ids.length > 0 ? _.max(ids) : 0;
  }

  function findAll(text, type) {
    var flags = 'g' + (type === 'label' ? 'm' : '');
    var matches = [];
    var re = new RegExp(REGEXS[type].source, flags);
    var found = re.exec(text);

    while (found) {
      matches.push(found);
      re.lastIndex = found.index + found[0].length;
      found = re.exec(text);
    }

    return matches;
  }

  /**
   * Other utilities
   */

  function hasTitle(link) {
    return _.isObject(link) && _.isString(link.title) && link.title.length > 0;
  }

  function buildLabel(link, id) {
    var markup = '[' + id + ']: ' + link.href;
    if (hasTitle(link)) { markup += ' "' + link.title + '"'; }
    return markup;
  }

  function buildRef(link, id) {
    return '[' + link.text + '][' + id + ']';
  }

}]);

angular.module('contentful').factory('LinkOrganizer/matchProcessors', function () {

  return {
    inline: function (match) {
      return {
        match: match[0],
        text: match[1],
        href: head(match[2]),
        title: extractTitle(tail(match[2]))
      };
    },
    ref: function (match) {
      return {
        match: match[0],
        text: match[1],
        id: match[2]
      };
    },
    label: function (match) {
      return {
        match: match[0],
        id:    match[1],
        href:  head(match[2]),
        title: extractTitle(tail(match[2]))
      };
    }
  };

  function extractTitle(title) {
    title = title || '';
    title = title.replace(/^ *('|"|\()*/, '');
    title = title.replace(/('|"|\))* *$/, '');
    return title;
  }

  function head(text) {
    return text.split(' ').shift();
  }

  function tail(text) {
    var segments = text.split(' ');
    segments.shift();
    return segments.join(' ');
  }

});
