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
