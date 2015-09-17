'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name widgets/migrations/data
 *
 * @description
 * This service exposes a list of widget migration specifications that
 * migrate the editing interface data of a content type.
 *
 * Each element is an object with a `from` and a `to` property. The
 * corresponding values are strings that represent widget IDs. A
 * migration description may also have a `fieldTypes` property. This is
 * an array of field type names. The migration will only take place for
 * fields whose type is included in that list.
 */
.value('widgets/migrations/data', [
  {
    from: 'youtubeEditor',
    to: 'urlEditor',
    fieldTypes: ['Symbol']
  },
  {
    from: 'radio',
    to: 'boolean',
    fieldTypes: ['Boolean']
  }
])

/**
 * @ngdoc service
 * @name widgets/migrations
 */
.factory('widgets/migrations', ['$injector', function ($injector) {

  var MIGRATIONS = $injector.get('widgets/migrations/data');

  return function editingInterfaceMigrator (contentType) {
    return function (editingInterface) {
      _.each(editingInterface.data.widgets, function (widget) {
        var field = findFieldForWidget(widget, contentType);
        migrateWidget(widget, field);
      });
      return editingInterface;
    };
  };


  /**
   * @param {API.Widget} widget
   * @param {API.Field} field
   */
  function migrateWidget (widget, field) {
    var id = widget.widgetId;
    var migration = _.find(MIGRATIONS, function (migration) {
      var fieldMatches = !migration.fieldTypes || _.contains(migration.fieldTypes, field.type);
      return fieldMatches && migration.from === id;
    });

    if (migration) {
      widget.widgetId = migration.to;
    }
  }

  function findFieldForWidget (widget, contentType) {
    return _.find(contentType.data.fields, {id: widget.fieldId});
  }

}]);
