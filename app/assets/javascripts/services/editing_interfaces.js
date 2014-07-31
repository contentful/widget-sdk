'use strict';
angular.module('contentful').factory('editingInterfaces', ['$injector', function($injector){
  var $q     = $injector.get('$q');
  var random = $injector.get('random');
  var widgetTypes = $injector.get('widgetTypes');

  return {
    forContentTypeWithId: function (contentType, id) {
      var cb = $q.callback();
      contentType.getEditorInterface(id, cb);
      return cb.promise
      .then(function (config) {
        return config;
      }, function (err) {
        if(err && err.statusCode === 404)
          return $q.when(defaultInterface(contentType));
        else
          return $q.reject(err);
      });
    },

    saveForContentType: function (contentType, editingInterface) {
      var cb = $q.callback();
      contentType.saveEditorInterface(editingInterface.id, editingInterface, cb);
      return cb.promise
      .then(function (res) {
        console.log(res);
      }, function (err) {
        console.log(err);
      });
    },

    defaultInterface: defaultInterface
  };

  function defaultInterface(contentType) {
    var config = {
      title: 'Default',
      id: 'default',
      contentTypeId: contentType.getId(),
      widgets: []
    };
    config.widgets = _.map(contentType.data.fields, _.partial(defaultWidget, contentType));

    return config;
  }

  function defaultWidget(contentType, field) {
    return {
      id: random.id(),
      type: 'field',
      fieldId: field.id, // TODO use internal id (field renaming)
      widgetType: widgetTypes.forFieldWithContentType(field, contentType),
      widgetParams: {}
    };
  }

}]);
