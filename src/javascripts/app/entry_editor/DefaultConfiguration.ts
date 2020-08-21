import { WidgetNamespace } from 'features/widget-renderer';
import { getReleasesFeatureVariation } from 'app/Releases/ReleasesFeatureFlag';
import EntryEditorWidgetTypes from './EntryEditorWidgetTypes';

interface EntryEditorWidget {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name?: string;
  description?: string;
}

const DefaultEntryEditor: EntryEditorWidget = {
  widgetId: EntryEditorWidgetTypes.DEFAULT_EDITOR.id,
  widgetNamespace: WidgetNamespace.EDITOR_BUILTIN,
  name: EntryEditorWidgetTypes.DEFAULT_EDITOR.name,
};

const ReferencesEntryEditor: EntryEditorWidget = {
  widgetId: EntryEditorWidgetTypes.REFERENCE_TREE.id,
  widgetNamespace: WidgetNamespace.EDITOR_BUILTIN,
  name: EntryEditorWidgetTypes.REFERENCE_TREE.name,
};

const EntryConfiguration = [DefaultEntryEditor, ReferencesEntryEditor];

const availabilityMap = {
  [EntryEditorWidgetTypes.DEFAULT_EDITOR.id]: () => true,
  [EntryEditorWidgetTypes.REFERENCE_TREE.id]: () => getReleasesFeatureVariation(),
};

export async function getEntryConfiguration() {
  const availability = await Promise.all(
    EntryConfiguration.map((widget) => {
      const isAvailable = availabilityMap[widget.widgetId];

      return isAvailable();
    })
  );

  return EntryConfiguration.filter((item, index) => availability[index] && item);
}
