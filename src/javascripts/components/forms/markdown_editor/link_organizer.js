'use strict';

angular.module('contentful').factory('LinkOrganizer', ['$injector', function () {

  var LINK_INLINE_RE =   /\[([^\r\n\[\]]+)]\(([^\r\n\)]+)\)/;
  var LINK_REF_RE    =   /\[([^\r\n\[\]]+)] ?\[([^\r\n\[\]]+)]/;
  var LINK_LABEL_RE  =   /^ {0,3}\[([^\r\n\[\]]+)]:\s+(.+)$/;

  return {
    scan:            scan,
    referizeInline:  referizeInline,
    getMergedLabels: getMergedLabels,
    rewriteRefs:     rewriteRefs,
    findInlineLinks: findInlineLinks,
    findRefLinks:    findRefLinks,
    findLabels:      findLabels,
    getMaxLabelId:   getMaxLabelId
  };

  function scan(text) {
    var data = {
      inline: findInlineLinks(text),
      ref:    findRefLinks(text),
      labels: findLabels(text)
    };

    data.maxLabelId = getMaxLabelId(data.labels);

    return data;
  }

  function referizeInline(text) {
    var id = getMaxLabelId(text) ;

    _.forEach(findInlineLinks(text), function (link) {
      id += 1;
      text = text.replace(link.match, buildRef(link, id));
      text += '\n' + buildLabel(link, id);
    });

    return text;
  }

  function getMergedLabels(text) {
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
    var merged = getMergedLabels(text);
    var hrefToRefId = {};
    var labels = [];
    var rewrites = [];
    var i = 1;

    // 1. compose list of labels with new ids, in order
    _.forEach(findRefLinks(text), function (ref) {
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

  function findInlineLinks(text) {
    var links = findAll(text, LINK_INLINE_RE);
    return _.map(links, processInlineLink);
  }

  function findRefLinks(text) {
    var links = findAll(text, LINK_REF_RE);
    return _.map(links, processRefLink);
  }

  function findLabels(text) {
    var labels = findAll(text, LINK_LABEL_RE, 'm');
    return _.map(labels, processLabel);
  }

  function getMaxLabelId(textOrLabels) {
    if (_.isString(textOrLabels)) {
      textOrLabels = findLabels(textOrLabels);
    }

    var ids = _(textOrLabels).pluck('id')
      .map(function (x) { return parseInt(x, 10); })
      .filter(function (x) { return _.isFinite(x) && x > 0; })
      .value();

    return ids.length > 0 ? _.max(ids) : 0;
  }

  function processInlineLink(match) {
    return {
      match: match[0],
      text:  match[1],
      href:  head(match[2]),
      title: extractTitle(tail(match[2]))
    };
  }

  function processRefLink(match) {
    return {
      match: match[0],
      text:  match[1],
      id:    match[2]
    };
  }

  function processLabel(match) {
    return {
      match: match[0],
      id:    match[1],
      href:  head(match[2]),
      title: extractTitle(tail(match[2]))
    };
  }

  function head(text) {
    return text.split(' ').shift();
  }

  function tail(text) {
    var segments = text.split(' ');
    segments.shift();
    return segments.join(' ');
  }

  function hasTitle(link) {
    return _.isObject(link) && _.isString(link.title) && link.title.length > 0;
  }

  function buildLabel(labelOrLink, id) {
    var markup = '[' + id + ']: ' + labelOrLink.href;
    if (hasTitle(labelOrLink)) { markup += ' "' + labelOrLink.title + '"'; }
    return markup;
  }

  function buildRef(link, id) {
    return '[' + link.text + '][' + id + ']';
  }

  function extractTitle(title) {
    title = title || '';
    title = title.replace( /^ *('|"|\()*/, '');
    title = title.replace( /('|"|\))* *$/, '');
    return title;
  }

  function findAll(text, re, additionalFlags) {
    additionalFlags = additionalFlags || '';
    var flags = 'g' + additionalFlags;
    var matches = [];
    re = new RegExp(re.source, flags);
    var found = re.exec(text);

    while (found) {
      matches.push(found);
      re.lastIndex = found.index + 1;
      found = re.exec(text);
    }

    return matches;
  }

}]);
