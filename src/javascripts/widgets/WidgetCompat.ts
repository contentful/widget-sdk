import {
  WidgetNamespace,
  HostingType,
  WidgetLocation,
  Widget,
  EntryFieldLocation,
} from 'features/widget-renderer';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';

export type LegacyWidget = ReturnType<typeof toLegacyWidget>;

export const toLegacyWidget = (widget: Widget) => {
  const locations = widget.locations.map((l) => l.location);
  const entryFieldLocation = widget.locations.find(
    (l) => l.location === WidgetLocation.ENTRY_FIELD
  );

  const legacy = {
    namespace: widget.namespace,
    id: widget.id,
    [widget.hosting.type === HostingType.SRC ? 'src' : 'srcdoc']: widget.hosting.value,
    name: widget.name,
    fieldTypes: entryFieldLocation
      ? (entryFieldLocation as EntryFieldLocation).fieldTypes.map(toInternalFieldType)
      : [],
    locations,
    sidebar: locations.includes(WidgetLocation.ENTRY_FIELD_SIDEBAR),
    parameters: widget.parameters.definitions.instance,
    installationParameters: {
      definitions: widget.parameters.definitions.installation,
      values: widget.parameters.values.installation,
    },
  };

  if (widget.namespace === WidgetNamespace.APP) {
    legacy.appDefinitionId = widget.id;
    legacy.appId = widget.slug;
    legacy.appIconUrl = widget.iconUrl;
  }

  return legacy;
};

export const toRendererWidget = (legacy: any): Widget => {
  const locations = legacy.locations.map((l) => ({ location: l }));
  const entryFieldLocation = locations.find((l) => l.location === WidgetLocation.ENTRY_FIELD);
  if (entryFieldLocation) {
    entryFieldLocation.fieldTypes = legacy.fieldTypes.map(toApiFieldType);
  }

  const hosting = {
    type: legacy.src ? HostingType.SRC : HostingType.SRCDOC,
    value: legacy.src || legacy.srcdoc,
  };
  const widget = {
    namespace: legacy.namespace,
    id: legacy.id,
    hosting,
    name: legacy.name,
    slug: legacy.id,
    iconUrl: '',
    locations,
    parameters: {
      definitions: {
        instance: legacy.parameters,
        installation: legacy.installationParameters.definitions,
      },
      values: {
        installation: legacy.installationParameters.values,
      },
    },
  };

  if (legacy.namespace === WidgetNamespace.APP) {
    widget.slug = legacy.appId;
    widget.iconUrl = legacy.appIconUrl;
  }

  return widget;
};
