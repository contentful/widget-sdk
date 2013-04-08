'use strict';

angular.module('contentful/classes').
  constant('toIdentifier', toIdentifier);

function toIdentifier(str) {
  var words = _.compact(str.split(/[\s\-_]/));
  if (_.isEmpty(words)) return;
  var first = words[0].toLowerCase();
  var rest =  words.slice(1).map(capitalize);
  return [first].concat(rest).join('');
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
