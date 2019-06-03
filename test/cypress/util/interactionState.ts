// All states for the interaction split into endpoint gropus
// States should be unique on every test run
// Every new state should be added to this module

export enum Token {
  VALID = 'token/valid'
}

export enum Resources {
  NONE = 'resources/none',
  DEFAULT = 'resources'
}

export enum OrgProductCatalogFeatures {
  SEVERAL = 'org_product_catalog_features/several'
}

export enum SpaceProductCatalogFeatures {
  SEVERAL = 'space_product_catalog_features/several'
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
  SNAPSHOTS = 'entries/snapshots',
  QUERY = 'entries/with-query'
}

export enum Assets {
  NONE = 'assets/none',
  SEVERAL = 'assets/several'
}

export enum Jobs {
  NONE = 'jobs/none',
  SINGLE = 'jobs/single',
  SEVERAL = 'jobs/several',
  ERROR = 'jobs/error',
  CREATED = 'jobs/created'
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
  NONE_INSTALLED = 'microbackends/apps/spaces/space_id'
}
