import * as auth from 'Authentication';

export type RequestMethod = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';

export type RequestConfig = {
  query?: Record<string, any>;
  method: RequestMethod;
  path?: string | (string | null | undefined)[];
  version?: number;
  data?: any;
};

export type AuthParamsType = Pick<typeof auth, 'getToken' | 'refreshToken'>;

/*
  Predefined headers are meant as editor support, we might want to split
  those into endpoint specific types at some point
 */
export type RequestHeaders = {
  'X-Contentful-Version'?: number;
  'X-Contentful-Skip-Transformation'?: boolean | string;
} & Record<string, string | number | boolean>;

export type ResponseEntity<T = unknown> = T;

export type CollectionResponse<T> = {
  sys: {
    type: 'Array';
  };
  limit: number;
  skip: number;
  total: number;
  items: T[];
};

export type BaseEndpoint<Scope> = {
  <T extends ResponseEntity>(config: RequestConfig, headers?: RequestHeaders): Promise<T>;
  type?: Scope;
};

export type UserEndpoint = BaseEndpoint<'User'>;
export type SpaceEndpoint = BaseEndpoint<'Space'> & { envId?: string | null; spaceId?: string };
export type ApiEndpoint = BaseEndpoint<'Api'>;
export type OrganizationEndpoint = BaseEndpoint<'Organization'>;
export type AppDefinitionEndpoint = BaseEndpoint<'AppDefinition'>;
export type Endpoint =
  | UserEndpoint
  | SpaceEndpoint
  | ApiEndpoint
  | OrganizationEndpoint
  | AppDefinitionEndpoint;
