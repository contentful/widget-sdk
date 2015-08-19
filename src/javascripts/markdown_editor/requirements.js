'use strict';

angular.module('contentful').factory('MarkdownEditor/requirements', function () {

  var MARKER_OFFSET = 10;

  return {
    getInfoLine:   getInfoLine,
    getSizeMarker: getSizeMarker
  };

  function getInfoLine(field) {
    var reqs = findSizeRequirements(field);
    var result = '';

    if (reqs.min || reqs.max) { add('Required characters: '); }
    if (reqs.min)             { add('min ' + reqs.min);       }
    if (reqs.min && reqs.max) { add(' / ');                   }
    if (reqs.max)             { add('max ' + reqs.max);       }

    return result;

    function add(s) { result += s; }
  }

  function getSizeMarker(field, fieldData) {
    var reqs = findSizeRequirements(field);
    var len = _.isString(fieldData.value) ? fieldData.value.length : 0;
    var o = MARKER_OFFSET;

    if      (reqs.min && len < reqs.min    ) { return m('invalid'); }
    else if (reqs.min && len < reqs.min + o) { return m('near');    }
    else if (reqs.max && len > reqs.max    ) { return m('invalid'); }
    else if (reqs.max && len > reqs.max - o) { return m('near');    }

    return m('ok');

    function m(marker) { return 'markdown-marker__' + marker; }
  }

  function findSizeRequirements(field) {
    return _(field.validations || [])
      .pluck('size')
      .filter(_.isObject)
      .first() || {};
  }
});
