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
  },
  {
    from: 'dropdown',
    to: 'boolean',
    fieldTypes: ['Boolean']
  },
  {
    from: 'newMarkdown',
    to: 'markdown'
  },
  {
    from: 'kalturaEditor',
    to: 'singleLine'
  },
  {
    from: 'kalturaMultiVideoEditor',
    to: 'listInput'
  },
  {
    from: 'ooyalaEditor',
    to: 'singleLine'
  },
  {
    from: 'ooyalaMultiAssetEditor',
    to: 'listInput'
  }
])

/**
 * @ngdoc service
 * @name widgets/migrations
 */
.factory('widgets/migrations', ['require', require => {
  var MIGRATIONS = require('widgets/migrations/data');

  /**
   * @ngdoc method
   * @name widgets/migrations#
   * @description
   * Migrate the widget ID of the field control if the original widget
   * has been replaced by a different one
   *
   * @param {Data.FieldControl}
   * @returns {Data.FieldControl}
   */
  return function migrateWidgetId (control) {
    var widgetId = control.widgetId;
    var field = control.field;
    var migration = _.find(MIGRATIONS, migration => {
      var appliesToFieldType = !migration.fieldTypes || _.includes(migration.fieldTypes, field.type);
      return appliesToFieldType && migration.from === widgetId;
    });

    if (migration) {
      return _.defaults({
        widgetId: migration.to
      }, control);
    } else {
      return control;
    }
  };
}]);
