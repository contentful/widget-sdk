'use strict';

angular.module('contentful').directive('cfContentTypeList', () => ({
  template: JST.content_type_list(),
  restrict: 'A',
  controller: 'ContentTypeListController'
}));
