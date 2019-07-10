// All states for the interaction split into endpoint groups
// States should be unique on every test run
// Every new state should be added to this module

// TODO: Have states to represent the internal state of the server
//  side before the request and separate interaction states named
//  after the actual interactions.

export enum Token {
  VALID = 'token/valid'
}

export enum Resources {
  SEVERAL = 'resources/several',
  SEVERAL_WITH_LIMITS_REACHED = 'resources/several-with-limits-reached'
}

export enum ProductCatalogFeatures {
  ORG_WITH_SEVERAL_FEATURES = 'product_catalog_features/org-with-several',
  SPACE_WITH_SEVERAL_FEATURES = 'product_catalog_features/space-with-several'
}

export enum PreviewEnvironments {
  NONE = 'preview_environments/none'
}

export enum Enforcements {
  NONE = 'enforcements/none'
}

export enum Environments {
  MASTER = 'environments/only-master'
}

export enum Users {
  SINGLE = 'users/single'
}

export enum Locales {
  ONLY_ENGLISH = 'locales/only-english'
}

export enum PublicContentTypes {
  NONE = 'content_types/no-public-content-types',
  SINGLE = 'content_types/one-single-content-type'
}

export enum Entries {
  NONE = 'entries/none',
  SEVERAL = 'entries/several',
  NO_LINKS_TO_DEFAULT_ENTRY = 'entries/no-links-to-default-entry',
  NO_LINKS_TO_DEFAULT_ASSET = 'entries/no-links-to-default-asset',
  NO_SNAPSHOTS_FOR_DEFAULT_ENTRY = 'entries/no-snapshots-for-default-entry'
}

export enum Assets {
  NONE = 'assets/none',
  SEVERAL = 'assets/several'
}

export enum Jobs {
  NONE = 'jobs/none',
  SINGLE = 'jobs/single',
  SEVERAL = 'jobs/several',
  INTERNAL_SERVER_ERROR = 'jobs/internal-server-error',
  JOB_EXECUTION_FAILED = 'jobs/job-execution-failed'
}

export enum Tasks {
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  INTERNAL_SERVER_ERROR = 'tasks/internal-server-error'
}

export enum Microbackends {
  OK = 'microbackends/ok'
}

export enum Extensions {
  NONE = 'extensions/none'
}

export enum ContentTypes {
  EDITORINTERFACE_WITHOUT_SIDEBAR = 'content_types/editor_interface_without_sidebar',
  EDITORINTERFACE_WITH_SIDEBAR = 'content_types/editor_interface_with_sidebar',
  SINGLE = 'content_types/single',
  SEVERAL = 'content_types/several',
  DEFAULT_CONTENT_TYPE_IS_PUBLISHED = 'content_types/default-content-type-is-published'
}

export enum Apps {
  NONE = 'microbackends/apps/none'
}

export enum Webhooks {
  NONE = 'webhooks/none',
  INTERNAL_SERVER_ERROR = 'webhooks/error',
  SINGLE = 'webhooks/single',
  NO_CALLS = 'webhooks/no-calls',
  SINGLE_EVENT = 'webhooks/single_event'
}
