'use strict';

angular.module('cf.app')
.factory('goToEntityEditor', ['require', function (require) {

  var $state = require('$state');

  var PLURALS = {
    Entry: 'entries',
    Asset: 'assets'
  };

  return function (linklike) {
    var type = getType(linklike);
    var typePlural = PLURALS[type];
    var path = 'spaces.detail.' + typePlural + '.detail';

    var options = {addToContext: true};
    var entityIdKey = type.toLowerCase() + 'Id';
    options[entityIdKey] = getId(linklike);

    return $state.go(path, options);
  };

  function getType (linklike) {
    var getTypeFn = _.isObject(linklike) && linklike.getType;
    if (_.isFunction(getTypeFn)) {
      return getTypeFn.call(linklike);
    } else {
      var type = dotty.get(linklike, 'sys.type');
      var linkType = dotty.get(linklike, 'sys.linkType');
      return linkType || type;
    }
  }

  function getId (linklike) {
    var getIdFn = _.isObject(linklike) && linklike.getId;
    if (_.isFunction(getIdFn)) {
      return getIdFn.call(linklike);
    } else {
      return dotty.get(linklike, 'sys.id');
    }
  }
}]);
