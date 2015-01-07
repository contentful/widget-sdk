'use strict';
angular.module('contentful').factory('editingInterfaces', ['$injector', function($injector){
  var $q           = $injector.get('$q');
  var environment  = $injector.get('environment');
  var notification = $injector.get('notification');
  var logger       = $injector.get('logger');
  var random       = $injector.get('random');
  var widgets      = $injector.get('widgets');

  var widgetIdsByContentType = {};

  return {
    forContentTypeWithId: function (contentType, interfaceId) {
      return getEditingInterface(contentType, interfaceId)
      .catch(function (err) {
        if(err && err.statusCode === 404)
          return $q.when(defaultInterface(contentType));
        else
          return $q.reject(err);
      })
      .then(_.partial(syncWidgets, contentType))
      .then(addDefaultParams);
    },

    save: function (editingInterface) {
      return editingInterface.save()
      .then(function (interf) {
        notification.info('Configuration saved successfully');
        return interf;
      }, function (err) {
        if(dotty.get(err, 'body.sys.type') == 'Error' && dotty.get(err, 'body.sys.id') == 'VersionMismatch')
          notification.warn('This configuration has been changed by another user. Please reload and try again.');
        else {
          logger.logServerError('There was a problem saving the configuration', {error: err });
          notification.error('There was a problem saving the configuration');
        }
        return $q.reject(err);
      });
    },

    syncWidgets: syncWidgets,

    defaultInterface: defaultInterface,
    staticWidget: staticWidget
  };

  function syncWidgets(contentType, interf) {
    pruneWidgets(contentType, interf);
    addMissingFields(contentType, interf);
    // TODO temporary order sync
    syncOrder(contentType, interf);
    return interf;
  }

  function addMissingFields(contentType, interf) {
    _(contentType.data.fields)
      .reject(fieldHasWidget)
      .map(_.partial(defaultWidget, contentType))
      .each(addWidget);
    return interf;

    function fieldHasWidget(field) {
      return _.any(interf.data.widgets, {fieldId: field.id});
    }

    function addWidget(widget){
      interf.data.widgets.push(widget); 
    }
  }

  function pruneWidgets(contentType, interf) {
    _.remove(interf.data.widgets, function(widget){
      return widget.widgetType === 'field' && !hasField(widget);
    });

    function hasField(widget) {
      return _.any(contentType.data.fields, {id: widget.fieldId});
    }
  }

  // TODO temporary function. This forces widgets order to always reflect fields
  function syncOrder(contentType, interf) {
    var newOrder = _.map(contentType.data.fields, function (field) {
      return _.find(interf.data.widgets, {fieldId: field.id});
    });
    var widgets = interf.data.widgets;
    widgets.splice.apply(widgets, [0, widgets.length].concat(newOrder));
    return interf;
  }

  function addDefaultParams(interf) {
    _.each(interf.data.widgets, function (widget) {
      var defaults = widgets.paramDefaults(widget.widgetId, widget.widgetType);
      _.defaults(widget.widgetParams, defaults);
    });
    return interf;
  }

  function getEditingInterface(contentType, interfaceId) {
    if (contentType.getId() === 'asset') {
      return $q.when(assetInterface(contentType));
    } else {
      return contentType.getEditingInterface(interfaceId);
    }
  }

  function defaultInterface(contentType) {
    var data = {
      sys: {
        id: 'default',
        type: 'EditingInterface'
      },
      title: 'Default',
      contentTypeId: contentType.getId(),
      widgets: []
    };
    var interf = contentType.newEditingInterface(data);
    interf.data.widgets = _.map(contentType.data.fields, _.partial(defaultWidget, contentType));
    return interf;
  }

  function assetInterface(contentType) {
    var data = {
      sys: {
        id: 'default',
        type: 'EditingInterface'
      },
      title: 'Default',
      contentTypeId: contentType.getId(),
      widgets: _.map(contentType.data.fields, _.partial(defaultWidget, contentType))
    };
    return { data: data };
  }

  function defaultWidget(contentType, field) {
    return {
      id: generateId(field.id, contentType.getId()),
      widgetType: 'field',
      fieldId: field.id,
      widgetId: widgets.defaultWidgetId(field, contentType),
      widgetParams: {}
    };
  }

  function staticWidget(widgetId) {
    return {
      id: random.id(),
      widgetType: 'static',
      widgetId: widgetId,
      widgetParams: {}
    };
  }

  function generateId(fieldId, ctId) {
    if(!widgetIdsByContentType[ctId])
      widgetIdsByContentType[ctId] = {};

    if(!widgetIdsByContentType[ctId][fieldId])
      widgetIdsByContentType[ctId][fieldId] = fieldId + random.id();

    return widgetIdsByContentType[ctId][fieldId];
  }

}]);
