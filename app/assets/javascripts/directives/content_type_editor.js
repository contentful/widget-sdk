'use strict';

angular.module('contentful').directive('contentTypeEditor', function(){
  return {
    template: JST.content_type_editor(),
    restrict: 'C',
    controller: 'ContentTypeEditorCtrl'
  };
});
