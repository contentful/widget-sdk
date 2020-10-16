export interface ValidationError {
  path: (string | number)[];
  details: string;
}
