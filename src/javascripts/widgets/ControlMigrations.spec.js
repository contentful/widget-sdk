import migrateControl from './ControlMigrations.es6';

describe('ControlMigrations', () => {
  it('migrates widget regardless of type', () => {
    const control = {
      fieldId: 'FID',
      widgetId: 'oldWidget',
      field: {}
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget'
      }
    ];

    const migrated = migrateControl(control, migrations);
    expect(migrated.widgetId).toEqual('newWidget');
  });

  it('migrates widget if field type matches', () => {
    const control = {
      fieldId: 'FID',
      widgetId: 'oldWidget',
      field: { apiName: 'apiName', type: 'ft1' }
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
        fieldTypes: ['ft1', 'ft2']
      }
    ];

    const migrated = migrateControl(control, migrations);
    expect(migrated.widgetId).toEqual('newWidget');
  });

  it('does not migrate widget if field type does not match', () => {
    const control = {
      fieldId: 'FID',
      widgetId: 'oldWidget',
      field: { apiName: 'apiName', type: 'ft1' }
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
        fieldTypes: ['ft2']
      }
    ];

    const migrated = migrateControl(control, migrations);
    expect(migrated.widgetId).toEqual('oldWidget');
  });
});
