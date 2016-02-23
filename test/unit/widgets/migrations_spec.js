'use strict';

describe('widgets/migrations', function() {
  beforeEach(function () {

    module('contentful/test', function ($provide) {
      $provide.value('widgets/migrations/data', []);
    });

    this.migrations = this.$inject('widgets/migrations/data');

    var createMigrator = this.$inject('widgets/migrations');
    this.migrate = function (ct, widget) {
      return createMigrator(ct)(widget);
    };
  });

  it('migrates widget regardless of type', function () {
    var contentType = makeContentType({id: 'FID'});
    var widget = {fieldId: 'FID', widgetId: 'oldWidget'};

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget'
    });

    var migrated = this.migrate(contentType, widget);
    expect(migrated.widgetId).toEqual('newWidget');
  });

  it('migrates widget if field type matches', function () {
    var contentType = makeContentType({apiName: 'apiName', type: 'ft1'});
    var widget ={fieldId: 'apiName', widgetId: 'oldWidget'};

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget',
      fieldTypes: ['ft1', 'ft2']
    });

    var migrated = this.migrate(contentType, widget);
    expect(migrated.widgetId).toEqual('newWidget');
  });

  it('does not migrate widget if field type does not match', function () {
    var contentType = makeContentType({apiName: 'apiName', type: 'ft1'});
    var widget = {fieldId: 'apiName', widgetId: 'oldWidget'};

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget',
      fieldTypes: ['ft2']
    });

    var migrated = this.migrate(contentType, widget);
    expect(migrated.widgetId).toEqual('oldWidget');
  });

  function makeContentType (field) {
    return {
      fields: [field]
    };
  }
});
