export interface ValidationError {
  path: (string | number)[];
  details: string;
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

// TODO: replace with types from management
export interface DataLink {
  sys: {
    id: string;
    type: 'Link';
    linkType: string;
  };
}
export interface AppBundleData {
  files: Array<{
    md5: string;
    name: string;
    size: number;
  }>;
  sys: {
    appDefinition: DataLink;
    createdAt: string;
    createdBy: DataLink;
    id: string;
    organization: DataLink;
    type: 'AppBundle';
    updatedAt: string;
    updatedBy: DataLink;
  };
  comment?: string;
}
