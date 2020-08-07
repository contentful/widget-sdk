export enum WidgetLocation {
  ENTRY_FIELD = 'entry-field',
  ENTRY_FIELD_SIDEBAR = 'entry-field-sidebar',
  ENTRY_SIDEBAR = 'entry-sidebar',
  DIALOG = 'dialog',
  ENTRY_EDITOR = 'entry-editor',
  PAGE = 'page',
  APP_CONFIG = 'app-config',
}

export enum WidgetNamespace {
  BUILTIN = 'builtin',
  EXTENSION = 'extension',
  SIDEBAR_BUILTIN = 'sidebar-builtin',
  APP = 'app',
  EDITOR_BUILTIN = 'editor-builtin',
}

export enum HostingType {
  SRC = 'src',
  SRCDOC = 'srcdoc',
}

export type ParameterType = 'Boolean' | 'Symbol' | 'Number' | 'Enum';
export type ParameterOption = string | { [key: string]: string };
export interface ParameterDefinition {
  name: string;
  id: string;
  description?: string;
  type: ParameterType;
  required?: boolean;
  default?: boolean | string | number;
  options?: ParameterOption[];
  labels?: {
    empty?: string;
    true?: string;
    false?: string;
  };
}

export type FieldType =
  | { type: 'Symbol' }
  | { type: 'Text' }
  | { type: 'RichText' }
  | { type: 'Integer' }
  | { type: 'Number' }
  | { type: 'Date' }
  | { type: 'Boolean' }
  | { type: 'Object' }
  | { type: 'Location' }
  | { type: 'Link'; linkType: 'Asset' }
  | { type: 'Link'; linkType: 'Entry' }
  | { type: 'Array'; items: { type: 'Symbol' } }
  | { type: 'Array'; items: { type: 'Link'; linkType: 'Entry' } }
  | { type: 'Array'; items: { type: 'Link'; linkType: 'Asset' } };

export type EntryFieldLocation = {
  location: WidgetLocation.ENTRY_FIELD;
  fieldTypes: FieldType[];
};

export type PageLocation = {
  location: WidgetLocation.PAGE;
  navigationItem?: {
    name: string;
    path: string;
  };
};

export type Location =
  | EntryFieldLocation
  | PageLocation
  | { location: WidgetLocation.ENTRY_SIDEBAR }
  | { location: WidgetLocation.ENTRY_EDITOR }
  | { location: WidgetLocation.DIALOG }
  | { location: WidgetLocation.APP_CONFIG }
  | { location: WidgetLocation.ENTRY_FIELD_SIDEBAR }; // legacy sidebar widget tied to a field

export type ExtensionParameterValues = Record<string, string | number | boolean>;
export type AppParameterValues = Record<string, any> | Array<any> | number | string | boolean;
export type ParameterValues = ExtensionParameterValues | AppParameterValues;

export interface Widget {
  namespace: WidgetNamespace;
  id: string;
  slug: string;
  iconUrl: string;
  name: string;
  hosting: {
    type: HostingType;
    value: string;
  };
  parameters: {
    definitions: {
      instance: ParameterDefinition[];
      installation: ParameterDefinition[];
    };
    values: {
      installation: ParameterValues;
    };
  };
  locations: Location[];
}

export interface Extension {
  sys: {
    type: 'Extension';
    id: string;
    srcdocSha256?: string;
  };
  extension: {
    name: string;
    fieldTypes?: FieldType[];
    src?: string;
    srcdoc?: string;
    sidebar?: boolean;
    parameters?: {
      instance?: ParameterDefinition[];
      installation?: ParameterDefinition[];
    };
  };
  parameters?: ExtensionParameterValues;
}

export interface AppInstallation {
  sys: {
    type: 'AppInstallation';
    appDefinition: {
      sys: {
        type: 'Link';
        linkType: 'AppDefinition';
        id: string;
      };
    };
  };
  parameters?: AppParameterValues;
}

export interface AppDefinition {
  sys: {
    type: 'AppDefinition';
    id: string;
  };
  name: string;
  src?: string;
  locations?: Location[];
}

export interface Control {
  fieldId: string;
  widgetNamespace?: WidgetNamespace;
  widgetId?: string;
  settings?: ExtensionParameterValues;
}

export interface SidebarItem {
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  settings?: ExtensionParameterValues;
}

export interface Editor {
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  settings?: ExtensionParameterValues;
}

export interface EditorInterface {
  sys: {
    type: 'EditorInterface';
    contentType: {
      sys: {
        type: 'Link';
        linkType: 'ContentType';
        id: string;
      };
    };
  };
  controls?: Control[];
  sidebar?: SidebarItem[];
  editor?: Editor;
  editors?: Editor[];
}
