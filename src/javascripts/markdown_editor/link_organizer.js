'use strict';

angular.module('contentful').factory('LinkOrganizer', ['require', require => {

  const PROCESSORS = require('LinkOrganizer/matchProcessors');
  const REGEXS     = {
    inline: /\[([^\r\n\[\]]+)]\(([^\r\n\)]+)\)/,
    ref:    /\[([^\r\n\[\]]+)] ?\[([^\r\n\[\]]+)]/,
    label:  /^ {0,3}\[([^\r\n\[\]]+)]:\s+(.+)$/
  };
  const findInline = makeFinder('inline');
  const findRefs   = makeFinder('ref');
  const findLabels = makeFinder('label');

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
    let id = findMaxLabelId(text);

    _.forEach(findInline(text), inline => {
      id += 1;
      text = text.replace(inline.match, buildRef(inline, id));
      text += '\n' + buildLabel(inline, id);
    });

    return text;
  }

  function mergeLabels(text) {
    const byHref = {};
    const byOldId = {};

    _.forEach(findLabels(text), label => {
      const alreadyAdded = byHref[label.href];
      const current = _.extend({}, label);

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
    const merged = mergeLabels(text);
    const hrefToRefId = {};
    const labels = [];
    const rewrites = [];
    let i = 1;

    // 1. compose list of labels with new ids, in order
    _.forEach(findRefs(text), ref => {
      const oldLabel = merged.byOldId[ref.id];
      if (!oldLabel) { return; }
      const href = oldLabel.href;
      let newRefId = hrefToRefId[href];

      if (!newRefId) {
        hrefToRefId[href] = newRefId = i;
        i += 1;
        labels.push(_.extend({ newId: newRefId }, oldLabel));
      }

      // 1b. prepare rewrites to be applied, with new label ids
      rewrites.push(_.extend({ newId: newRefId }, ref));
    });

    // 2. remove all labels!
    _.forEach(findLabels(text), label => {
      text = text.replace(label.match, '');
    });

    // 3. remove whitespace from the end of text
    text = text.replace(/[\r\n\s]*$/, '');
    text += '\n\n';

    // 4. apply rewrites
    _.forEach(rewrites, ref => {
      text = text.replace(ref.match, buildRef(ref, ref.newId));
    });

    // 5. print new labels at the end of text
    _.forEach(labels, label => {
      text += '\n' + buildLabel(label, label.newId);
    });

    return text;
  }

  /**
   * Finding stuff
   */

  function makeFinder(type) {
    return text => _.map(findAll(text, type), PROCESSORS[type]);
  }

  function findMaxLabelId(textOrLabels) {
    if (_.isString(textOrLabels)) {
      textOrLabels = findLabels(textOrLabels);
    }

    const ids = _(textOrLabels).map('id')
      .map(x => parseInt(x, 10))
      .filter(x => _.isFinite(x) && x > 0)
      .value();

    return ids.length > 0 ? _.max(ids) : 0;
  }

  function findAll(text, type) {
    const flags = 'g' + (type === 'label' ? 'm' : '');
    const matches = [];
    const re = new RegExp(REGEXS[type].source, flags);
    let found = re.exec(text);

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
    let markup = '[' + id + ']: ' + link.href;
    if (hasTitle(link)) { markup += ' "' + link.title + '"'; }
    return markup;
  }

  function buildRef(link, id) {
    return '[' + link.text + '][' + id + ']';
  }

}]);

angular.module('contentful').factory('LinkOrganizer/matchProcessors', () => {

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
    const segments = text.split(' ');
    segments.shift();
    return segments.join(' ');
  }

});
