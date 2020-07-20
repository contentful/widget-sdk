import { migrateControl } from './ControlMigrations';
import { WidgetNamespace } from 'features/widget-renderer';

describe('ControlMigrations', () => {
  it('migrates widget regardless of type', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: WidgetNamespace.BUILTIN,
      widgetId: 'oldWidget',
      field: {},
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
      },
    ];

    expect(migrateControl(control, migrations)).toEqual('newWidget');
  });

  it('migrates widget if field type matches', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: WidgetNamespace.BUILTIN,
      widgetId: 'oldWidget',
      field: { apiName: 'apiName', type: 'ft1' },
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
        fieldTypes: ['ft1', 'ft2'],
      },
    ];

    expect(migrateControl(control, migrations)).toEqual('newWidget');
  });

  it('does not migrate widget if field type does not match', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: WidgetNamespace.BUILTIN,
      widgetId: 'oldWidget',
      field: { apiName: 'apiName', type: 'ft1' },
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
        fieldTypes: ['ft2'],
      },
    ];

    expect(migrateControl(control, migrations)).toEqual('oldWidget');
  });

  it('does not migrate widget if is not a builtin', () => {
    const control = {
      fieldId: 'FID',
      widgetNamespace: WidgetNamespace.EXTENSION,
      widgetId: 'oldWidget',
      field: { apiName: 'apiName', type: 'ft1' },
    };

    const migrations = [
      {
        from: 'oldWidget',
        to: 'newWidget',
        fieldTypes: ['ft1'],
      },
    ];

    expect(migrateControl(control, migrations)).toEqual('oldWidget');
  });
});
