'use strict';

/**
 * @ngdoc service
 * @name analyticsEvents
 * @description
 * Collection of functions that trigger specific analytics events.
 */
angular.module('contentful')
.factory('analyticsEvents', ['$injector', function ($injector) {
  var analytics = $injector.get('analytics');
  var getFieldLabel = $injector.get('fieldFactory').getLabel;
  var Widgets = $injector.get('widgets');

  return {
    trackField: trackField,
    trackWidgetEventIfCustom: trackWidgetEventIfCustom
  };

  /**
   * @ngdoc method
   * @name analyticsEvents#trackField
   * @description
   * Trigger an event with `fieldId` and `originatingFieldType`
   * properties.
   *
   * @param {string}  message
   * @param {Field}   field
   * @param {object}  data
   *   Additional properties to attach to the event
   */
  function trackField (message, field, data) {
    analytics.track(message, _.extend({
      fieldId: field.id,
      originatingFieldType: getFieldLabel(field)
    }, data));
  }

  function trackWidgetEventIfCustom (event, widget, field, extra) {
    var descriptor = Widgets.get(widget.widgetId);
    var isCustom = descriptor && descriptor.custom;
    if (!isCustom) {
      return;
    }

    var props = _.extend({
      widgetId: descriptor.id,
      widgetName: descriptor.name,
      fieldType: getFieldLabel(field),
    }, extra);

    analytics.track(event, props);
    analytics.trackTotango(event, 'UI');
  }

}]);
