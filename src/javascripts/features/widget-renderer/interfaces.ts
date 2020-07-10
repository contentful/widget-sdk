export type WidgetNamespace = 'app' | 'extension' | 'builtin';
type HostingType = 'src' | 'srcdoc';

type ParameterType = 'Boolean' | 'Symbol' | 'Number' | 'Enum';
type ParameterOption = string | { [key: string]: string };
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

type EntryFieldLocation = {
  location: 'entry-field';
  fieldTypes: FieldType[];
};

type PageLocation = {
  location: 'page';
  navigationItem?: {
    name: string;
    path: string;
  };
};

export type Location =
  | EntryFieldLocation
  | PageLocation
  | { location: 'entry-sidebar' }
  | { location: 'entry-editor' }
  | { location: 'dialog' }
  | { location: 'app-config' }
  | { location: 'entry-field-sidebar' };

export interface Widget {
  // Minimal data needed to list widgets
  namespace: WidgetNamespace;
  id: string;
  slug: string;
  iconUrl: string;
  name: string;
  // For rendering
  hosting: {
    type: HostingType;
    value: string; // src or srcdoc, up to renderer to check "type"
  };
  parameters: {
    definitions: {
      instance: ParameterDefinition[]; // empty arr for apps
      installation: ParameterDefinition[]; // empty arr for apps
    };
    values: {
      installation: any; // if not present in the api default to `{}`
    };
  };
  // For assignment and misc
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
  parameters?: Record<string, string | number | boolean>;
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
  parameters?: Record<string, any> | Array<any> | number | string | boolean;
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
