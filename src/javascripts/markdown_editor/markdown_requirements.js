'use strict';

angular.module('contentful').factory('MarkdownEditor/requirements', function () {

  var MARKER_OFFSET = 10;

  return {
    getInfoLine:          getInfoLine,
    getSizeMarker:        getSizeMarker,
    findSizeRequirements: findSizeRequirements
  };

  function getInfoLine(validations) {
    var reqs = findSizeRequirements(validations);
    var result = '';

    if (reqs.min && reqs.max) {
      result = 'Requires between ' + reqs.min + ' and ' + reqs.max + ' characters';
    } else if (reqs.min) {
      result = 'Requires at least ' + reqs.min + ' characters';
    } else if (reqs.max) {
      result = 'Requires no more than ' + reqs.max + ' characters';
    }

    return result;
  }

  function getSizeMarker(reqs, len) {
    var o = MARKER_OFFSET;

    if      (reqs.min && len < reqs.min    ) { return m('invalid'); }
    else if (reqs.min && len < reqs.min + o) { return m('near');    }
    else if (reqs.max && len > reqs.max    ) { return m('invalid'); }
    else if (reqs.max && len > reqs.max - o) { return m('near');    }

    return m('ok');

    function m(marker) { return 'markdown-marker__' + marker; }
  }

  function findSizeRequirements(validations) {
    return _(validations || [])
      .map('size')
      .filter(_.isObject)
      .first() || {};
  }
});

angular.module('contentful').directive('cfMarkdownRequirements', ['$injector', function ($injector) {

  var requirements = $injector.get('MarkdownEditor/requirements');

  return {
    restrict: 'E',
    scope: { preview: '=' },
    template: '<div class="markdown-info__requirements">{{ infoLine }}</div>',
    link: function (scope) {
      scope.$watch('preview.field.validations', addInfoLine, true);

      function addInfoLine(validations) {
        scope.infoLine = requirements.getInfoLine(validations);
      }
    }
  };
}]);

angular.module('contentful').directive('cfMarkdownStats', ['$injector', function ($injector) {

  var requirements = $injector.get('MarkdownEditor/requirements');

  return {
    restrict: 'E',
    scope: { preview: '=' },
    template: [
      '<div class="markdown-info__stats">',
        '{{ preview.info.words }} words, ',
        '<span ng-class="marker">{{ preview.info.chars }} characters</span>',
      '</div>'
    ].join(''),
    link: function(scope) {
      var sizeRequirements = {};

      scope.$watch('preview.field.validations', findRequirements, true);
      scope.$watch('preview.info.chars', addMarker);

      function findRequirements(validations) {
        sizeRequirements = requirements.findSizeRequirements(validations);
      }

      function addMarker(length) {
        scope.marker = requirements.getSizeMarker(sizeRequirements, length);
      }
    }
  };
}]);
