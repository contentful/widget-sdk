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
    trackEventIfCustom('modelling:custom_extension_selected', widgetLink, field, {
      contentTypeId: ct && ct.getId()
    });
  }

  function rendered (widget, ct, entry) {
    trackEventIfCustom('entry_editor:custom_extension_rendered', widget, widget.field, {
      contentTypeId: ct && ct.getId(),
      entryId: entry && entry.getId()
    });
  }

  function trackEventIfCustom (event, widget, field, extraData) {
    var descriptor = Widgets.get(widget.widgetId);
    var isCustom = descriptor && descriptor.custom;

    if (isCustom) {
      analytics.track(event, _.extend({
        extensionId: descriptor.id,
        extensionName: descriptor.name,
        fieldType: getFieldLabel(field)
      }, extraData || {}));
    }
  }
}]);
