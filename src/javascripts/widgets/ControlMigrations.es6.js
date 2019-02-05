import { NAMESPACE_BUILTIN } from './WidgetNamespaces.es6';

/**
 * This service exposes a list of widget migration specifications that
 * migrate the editor interface of a content type.
 *
 * Each element is an object with a `from` and a `to` property. The
 * corresponding values are strings that represent widget IDs. A
 * migration description may also have a `fieldTypes` property. This is
 * an array of field type names. The migration will only take place for
 * fields whose type is included in that list.
 */
const DEFAULT_MIGRATIONS = [
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
];

export default function migrateControl(control, migrations = DEFAULT_MIGRATIONS) {
  const { field, widgetNamespace, widgetId } = control;

  // All migrations are applicable to builtins only.
  if (widgetNamespace !== NAMESPACE_BUILTIN) {
    return widgetId;
  }

  const migration = migrations.find(({ fieldTypes, from }) => {
    const applicable = !Array.isArray(fieldTypes) || fieldTypes.includes(field.type);
    return applicable && from === widgetId;
  });

  return migration ? migration.to : widgetId;
}
