'use strict';

describe('widgets/migrations', function() {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('widgets/migrations/data', []);
    });

    this.migrations = this.$inject('widgets/migrations/data');
    this.migrate = this.$inject('widgets/migrations');
  });

  it('migrates widget regardless of type', function () {
    var control = {
      fieldId: 'FID',
      widgetId: 'oldWidget',
      field: {}
    };

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget'
    });

    var migrated = this.migrate(control);
    expect(migrated.widgetId).toEqual('newWidget');
  });

  it('migrates widget if field type matches', function () {
    var control = {
      fieldId: 'FID',
      widgetId: 'oldWidget',
      field: {apiName: 'apiName', type: 'ft1'}
    };

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget',
      fieldTypes: ['ft1', 'ft2']
    });

    var migrated = this.migrate(control);
    expect(migrated.widgetId).toEqual('newWidget');
  });

  it('does not migrate widget if field type does not match', function () {
    var control = {
      fieldId: 'FID',
      widgetId: 'oldWidget',
      field: {apiName: 'apiName', type: 'ft1'}
    };

    this.migrations.push({
      from: 'oldWidget',
      to: 'newWidget',
      fieldTypes: ['ft2']
    });

    var migrated = this.migrate(control);
    expect(migrated.widgetId).toEqual('oldWidget');
  });
});
