import migrateControl from './ControlMigrations.es6';

describe('ControlMigrations', () => {
  it('migrates widget regardless of type', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: 'builtin',
      widgetId: 'oldWidget',
      field: {}
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget'
      }
    ];

    expect(migrateControl(control, migrations)).toEqual('newWidget');
  });

  it('migrates widget if field type matches', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: 'builtin',
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

    expect(migrateControl(control, migrations)).toEqual('newWidget');
  });

  it('does not migrate widget if field type does not match', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: 'builtin',
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

    expect(migrateControl(control, migrations)).toEqual('oldWidget');
  });

  it('does not migrate widget if is not a builtin', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: 'extension',
      widgetId: 'oldWidget',
      field: { apiName: 'apiName', type: 'ft1' }
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
        fieldTypes: ['ft1']
      }
    ];

    expect(migrateControl(control, migrations)).toEqual('oldWidget');
  });
});
