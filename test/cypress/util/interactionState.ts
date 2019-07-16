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
  NO_JOBS_FOR_DEFAULT_SPACE = 'jobs/no-jobs-for-default-space',
  ONE_JOB_FOR_DEFAULT_SPACE = 'jobs/one-job-for-default-space',
  SEVERAL_JOBS_FOR_DEFAULT_SPACE = 'jobs/several-jobs-for-default-space',
  INTERNAL_SERVER_ERROR = 'jobs/internal-server-error',
  JOB_EXECUTION_FAILED = 'jobs/job-execution-failed',
  NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/no-jobs-scheduled-for-default-entry',
  ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/one-pending-job-scheduled-for-default-entry'
}

export enum Tasks {
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  SEVERAL_ONE_OPEN = 'tasks/several-one-open',
  SEVERAL_ONE_RESOLVED = 'tasks/several-one-resolved',
  SEVERAL_ONE_REOPENED = 'tasks/several-one-reopened',
  INTERNAL_SERVER_ERROR = 'tasks/internal-server-error'
}

export enum Microbackends {
  OK = 'microbackends/ok'
}

export enum Extensions {
  NONE = 'extensions/none'
}

export enum ContentTypes {
  NONE = 'content_types/none',
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
  SINGLE_EVENT = 'webhooks/single_event',
  ALL_SETTINGS = 'webhooks/all-settings'
}
