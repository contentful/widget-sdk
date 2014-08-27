'use strict';
angular.module('contentful').factory('editingInterfaces', ['$injector', function($injector){
  var $q           = $injector.get('$q');
  var random       = $injector.get('random');
  var notification = $injector.get('notification');
  var widgetTypes  = $injector.get('widgetTypes');

  return {
    forContentTypeWithId: function (contentType, interfaceId) {
      return getEditorInterface(contentType, interfaceId)
      .catch(function (err) {
        if(err && err.statusCode === 404)
          return $q.when(defaultInterface(contentType));
        else
          return $q.reject(err);
      });
    },

    save: function (editingInterface) {
      var cb = $q.callback();
      editingInterface.save(cb);
      return cb.promise
      .then(function (interf) {
        notification.info('Configuration saved successfully');
        return interf;
      }, function (err) {
        if(dotty.get(err, 'body.sys.type') == 'Error' && dotty.get(err, 'body.sys.id') == 'VersionMismatch')
          notification.warn('This configuration has been changed by another user. Please reload and try again.');
        else
          notification.serverError('There was a problem saving the configuration', err);
      });
    },

    defaultInterface: defaultInterface
  };

  function getEditorInterface(contentType, interfaceId) {
    if (contentType.getId() === 'asset') {
      return $q.when(assetInterface(contentType));
    } else {
      var cb = $q.callback();
      contentType.getEditorInterface(interfaceId, cb);
      return cb.promise;
    }
  }

  function defaultInterface(contentType) {
    var data = {
      sys: {
        id: 'default',
        type: 'EditorInterface'
      },
      title: 'Default',
      contentTypeId: contentType.getId(),
      widgets: []
    };
    var interf = contentType.newEditorInterface(data);
    interf.data.widgets = _.map(contentType.data.fields, _.partial(defaultWidget, contentType));
    return interf;
  }

  function assetInterface(contentType) {
    var data = {
      sys: {
        id: 'default',
        type: 'EditorInterface'
      },
      title: 'Default',
      contentTypeId: contentType.getId(),
      widgets: _.map(contentType.data.fields, _.partial(defaultWidget, contentType))
    };
    return { data: data };
  }

  function defaultWidget(contentType, field) {
    return {
      id: random.id(),
      type: 'field',
      fieldId: field.id, // TODO use internal id (field renaming)
      widgetType: widgetTypes.defaultType(field, contentType),
      widgetParams: {}
    };
  }

}]);
