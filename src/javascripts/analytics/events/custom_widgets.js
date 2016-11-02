'use strict';

angular.module('contentful')

.factory('analyticsEvents/customWidgets', ['require', function (require) {
  var analytics = require('analytics');
  var Widgets = require('widgets');
  var getFieldLabel = require('fieldFactory').getLabel;

  return {
    selected: selected,
    rendered: rendered
  };

  function selected (widgetLink, field, ct) {
    trackEventIfCustom('Custom Widget selected', widgetLink, field, ct.getId());
  }

  function rendered (widget, ctId) {
    trackEventIfCustom('Custom Widget rendered', widget, widget.field, ctId);
  }

  function trackEventIfCustom (event, widget, field, contentTypeId) {
    var descriptor = Widgets.get(widget.widgetId);
    var isCustom = descriptor && descriptor.custom;

    if (isCustom) {
      analytics.track(event, {
        widgetId: descriptor.id,
        widgetName: descriptor.name,
        fieldType: getFieldLabel(field),
        contentTypeId: contentTypeId
      });
    }
  }
}]);
