'use strict';

describe('widgets/migrations', function() {
  beforeEach(function () {

    module('contentful/test', function ($provide) {
      $provide.value('widgets/migrations/data', []);
    });

    this.migrations = this.$inject('widgets/migrations/data');

    var createMigrator = this.$inject('widgets/migrations');
    this.migrate = function (ct, ei) {
      createMigrator(ct)(ei);
    };
  });

  it('migrates widget regardless of type', function () {
    var contentType = makeContentType({id: 'FID'});
    var editingInterface = makeEditingInterface({fieldId: 'FID', widgetId: 'oldWidget'});

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget'
    });

    expect(editingInterface.data.widgets[0].widgetId).toEqual('oldWidget');
    this.migrate(contentType, editingInterface);
    expect(editingInterface.data.widgets[0].widgetId).toEqual('newWidget');
  });

  it('migrates widget if field type matches', function () {
    var contentType = makeContentType({id: 'FID', type: 'ft1'});
    var editingInterface = makeEditingInterface({fieldId: 'FID', widgetId: 'oldWidget'});

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget',
      fieldTypes: ['ft1', 'ft2']
    });

    expect(editingInterface.data.widgets[0].widgetId).toEqual('oldWidget');
    this.migrate(contentType, editingInterface);
    expect(editingInterface.data.widgets[0].widgetId).toEqual('newWidget');
  });

  it('does not migrate widget if field type does not match', function () {
    var contentType = makeContentType({id: 'FID', type: 'ft1'});
    var editingInterface = makeEditingInterface({fieldId: 'FID', widgetId: 'oldWidget'});

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget',
      fieldTypes: ['ft2']
    });

    expect(editingInterface.data.widgets[0].widgetId).toEqual('oldWidget');
    this.migrate(contentType, editingInterface);
    expect(editingInterface.data.widgets[0].widgetId).toEqual('oldWidget');
  });

  function makeEditingInterface (widget) {
    return {
      data: {
        widgets: [widget]
      }
    };
  }

  function makeContentType (field) {
    return {
      data: {
        fields: [field]
      }
    };
  }
});
