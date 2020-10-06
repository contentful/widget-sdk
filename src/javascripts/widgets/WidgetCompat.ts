import {
  WidgetNamespace,
  HostingType,
  WidgetLocation,
  Widget,
  EntryFieldLocation,
} from '@contentful/widget-renderer';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';

export interface LegacyWidget {
  namespace: WidgetNamespace;
  id: string;
  name: string;
  fieldTypes: (string | undefined)[];
  locations: WidgetLocation[];
  sidebar: boolean;
  parameters: Widget['parameters']['definitions']['instance'];
  installationParameters: {
    definitions: Widget['parameters']['definitions']['installation'];
    values: Widget['parameters']['values']['installation'];
  };

  src?: string;
  srcdoc?: string;

  appDefinitionId?: string;
  appId?: string;
  appIconUrl?: string;
}

export const toLegacyWidget = (widget: Widget): LegacyWidget => {
  const locations = widget.locations.map((l) => l.location);
  const entryFieldLocation = widget.locations.find(
    (l) => l.location === WidgetLocation.ENTRY_FIELD
  );

  const legacy: LegacyWidget = {
    namespace: widget.namespace,
    id: widget.id,
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

  if (widget.hosting.type === HostingType.SRC) {
    legacy.src = widget.hosting.value;
  } else if (widget.hosting.type === HostingType.SRCDOC) {
    legacy.srcdoc = widget.hosting.value;
  }

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

  let hosting: Widget['hosting'];
  if (legacy.src) {
    hosting = {
      type: HostingType.SRC,
      value: legacy.src,
    };
  } else if (legacy.srcdoc) {
    hosting = {
      type: HostingType.SRCDOC,
      value: legacy.srcdoc,
    };
  } else {
    hosting = {
      type: HostingType.BACKEND_ONLY,
      value: '',
    };
  }

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
