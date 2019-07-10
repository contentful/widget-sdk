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
  DEFAULT = 'resources',
  LIMITS_REACHED = 'resources/limits_reached'
}

export enum OrgProductCatalogFeatures {
  SEVERAL = 'org_product_catalog_features/several'
}

export enum SpaceProductCatalogFeatures {
  SEVERAL = 'space_product_catalog_features/several',
  USAGE_ENFORCEMENT = 'space_product_catalog_features/env_usage_enforcements'
}

export enum PreviewEnvironments {
  NONE = 'preview_environments/none'
}

export enum Enforcements {
  NONE = 'enforcements/none'
}

export enum Environments {
  MASTER = 'environments/master'
}

export enum Users {
  SINGLE = 'users/single',
  QUERY = 'users/with-query'
}

export enum Locales {
  DEFAULT = 'locales/default'
}

export enum PublicContentTypes {
  NONE = 'public/content_types/none',
  SINGLE = 'public/content_types/single'
}

export enum Entries {
  NONE = 'entries/none',
  SEVERAL = 'entries/several',
  LINKS = 'entries/links',
  ASSET_LINKS = 'entries/asset-links',
  SNAPSHOTS = 'entries/snapshots',
  QUERY = 'entries/with-query',
  POST = 'entries/post'
}

export enum Assets {
  NONE = 'assets/none',
  SEVERAL = 'assets/several',
  DEFAULT = 'assets/default'
}

export enum Jobs {
  NONE = 'jobs/none',
  SINGLE = 'jobs/single',
  SEVERAL = 'jobs/several',
  ERROR = 'jobs/error',
  CREATED = 'jobs/created',
  CANCEL = 'jobs/cancel',
  FAILED = 'jobs/failed'
}

export enum Tasks {
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  ERROR = 'tasks/error',
  CREATE = 'tasks/create'
}

export enum Microbackends {
  STREAMTOKEN = 'microbackends/streamtoken'
}

export enum ContentType {
  DEFAULT = 'content_types/id/default',
  PUBLISHED = 'content_types/id/published'
}

export enum Extensions {
  NONE = 'estensions/none'
}

export enum ContentTypes {
  EDITORINTERFACE_WITHOUT_SIDEBAR = 'content_types/editor_interface_without_sidebar',
  EDITORINTERFACE_WITH_SIDEBAR = 'content_types/editor_interface_with_sidebar',
  SINGLE = 'content_types/single',
  SEVERAL = 'content_types/several'
}

export enum Apps {
  NONE = 'microbackends/apps/spaces/space_id'
}

export enum Webhooks {
  NONE = 'webhooks/none',
  ERROR = 'webhooks/error',
  SINGLE = 'webhooks/single',
  CALLS_NONE = 'webhooks/id/health'
}

export enum Webhook {
  DEFAULT = 'webhooks/id/default',
  CALLS_NONE = 'webhooks/id/calls/none',
  SINGLE_EVENT = 'webhooks/id/single_event',
  CALL_SUCCESSFUL = 'webhooks/id/calls/successful'
}
