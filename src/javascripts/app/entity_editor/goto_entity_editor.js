'use strict';

angular.module('cf.app')
.factory('goToEntityEditor', ['require', function (require) {

  var $state = require('$state');

  var PLURALS = {
    Entry: 'entries',
    Asset: 'assets'
  };

  goToEntityEditor.getStateRef = getStateRef;
  return goToEntityEditor;

  function getStateRef (linklike) {
    var options = getOptions(linklike);
    var paramsString = '{addToContext: \'' + options.addToContext + '\', ';
    paramsString += options.entryId ? 'entryId' : 'assetId';
    paramsString += ': \'' + (options.entryId || options.assetId) + '\'}';

    return getPath(linklike) + '(' + paramsString + ')';
  }

  function goToEntityEditor (linklike) {
    return $state.go(getPath(linklike), getOptions(linklike));
  }

  function getPath (linklike) {
    var type = getType(linklike);
    var typePlural = PLURALS[type];

    return 'spaces.detail.' + typePlural + '.detail';
  }

  function getOptions (linklike) {
    var type = getType(linklike);
    var options = {addToContext: true};
    var entityIdKey = type.toLowerCase() + 'Id';
    options[entityIdKey] = getId(linklike);

    return options;
  }

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
