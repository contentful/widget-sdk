import { WidgetNamespace } from '@contentful/widget-renderer';
import { FLAGS, getVariation } from 'LaunchDarkly';
import EntryEditorWidgetTypes from './EntryEditorWidgetTypes';
import { getSpaceFeature, SpaceFeatures } from 'data/CMA/ProductCatalog';
interface EntryEditorWidget {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name?: string;
  description?: string;
}

interface SpaceData {
  spaceId: string;
  environmentId: string;
  organizationId: string;
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

const TagsEditor: EntryEditorWidget = {
  widgetId: EntryEditorWidgetTypes.TAGS_EDITOR.id,
  widgetNamespace: WidgetNamespace.EDITOR_BUILTIN,
  name: EntryEditorWidgetTypes.TAGS_EDITOR.name,
};

const EntryConfiguration = [DefaultEntryEditor, ReferencesEntryEditor, TagsEditor];

const getAvailabilityMap = (spaceId) => ({
  [EntryEditorWidgetTypes.DEFAULT_EDITOR.id]: () => true,
  [EntryEditorWidgetTypes.REFERENCE_TREE.id]: async (spaceData: SpaceData) =>
    getVariation(FLAGS.ALL_REFERENCES_DIALOG, spaceData),
  [EntryEditorWidgetTypes.TAGS_EDITOR.id]: async () =>
    getSpaceFeature(spaceId, SpaceFeatures.PC_CONTENT_TAGS, false),
});

export async function getEntryConfiguration(spaceData: SpaceData) {
  const availabilityMap = getAvailabilityMap(spaceData.spaceId);
  const availability = await Promise.all(
    EntryConfiguration.map((widget) => {
      const isAvailable = availabilityMap[widget.widgetId];

      return isAvailable(spaceData);
    })
  );

  return EntryConfiguration.filter((item, index) => availability[index] && item);
}
