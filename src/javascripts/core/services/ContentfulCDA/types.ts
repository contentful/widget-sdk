import type { Entry } from 'contentful';

/**
 * These are the content types defined in Contentful
 * for the "Webapp content" space inside "Contentful ProdDev" organization
 */
export enum WebappContentTypes {
  TABLE = 'webappTable',
  INTERNAL_ACTION = 'internalAction',
  INTERNAL_VARIABLE = 'internalVariable',
  CONTENT_WITH_TOOLTIP = 'tooltip',
}

export interface WebappTable {
  name: string;
  table: { tableData: Array<string[]> };
  extras: Entry<Tooltip>[];
}

interface Tooltip {
  text: string;
  tooltipContent: string;
}

/**
 * These are the possible values of an internalAction (check the model in contentful)
 */
export enum InternalActionValues {
  ADD_SPACE = 'add_space',
  CHANGE_SPACE = 'change_space',
  MANAGE_USERS = 'manage_users',
}

/**
 * These are the possible values of an internalVariable (check the model in contentful)
 */
export enum InternalVariableValues {
  LIMIT_OF_USERS = 'limit_of_users',
  NUMBER_OF_USERS = 'number_of_users',
}
