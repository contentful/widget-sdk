import {
  Asset,
  CanonicalRequest,
  ContentType,
  EditorInterface,
  ScheduledAction,
  Tag,
  Team,
  User,
  TagVisibility,
  KeyValueMap,
  Entry,
  QueryOptions,
} from './entities'
import {
  CollectionResponse,
  ContentEntityType,
  Link,
  WithOptionalId,
  SearchQuery,
  WithId,
} from './utils'

type Snapshot<T> = {
  sys: {
    space?: Link
    status?: Link
    publishedVersion?: number
    archivedVersion?: number
    archivedBy?: Link
    archivedAt?: string
    deletedVersion?: number
    deletedBy?: Link
    deletedAt?: string
    snapshotType: string
    snapshotEntityType: string
  }
  snapshot: T
}

export interface SpaceAPI {
  getCachedContentTypes: () => ContentType[]
  getContentType: (id: string) => Promise<ContentType>
  getContentTypes: () => Promise<CollectionResponse<ContentType>>
  createContentType: (data: WithId<ContentType>) => Promise<ContentType>
  updateContentType: (data: ContentType) => Promise<ContentType>
  deleteContentType: (contentTypeId: string) => Promise<void>

  getEntry: <Fields extends KeyValueMap = KeyValueMap>(id: string) => Promise<Entry<Fields>>
  getEntrySnapshots: <Fields extends KeyValueMap = KeyValueMap>(
    id: string
  ) => Promise<CollectionResponse<Snapshot<Entry<Fields>>>>
  getEntries: <Fields, Query extends SearchQuery = SearchQuery>(
    query?: Query
  ) => Promise<CollectionResponse<Entry<Fields>>>
  createEntry: <Fields>(
    contentTypeId: string,
    data: WithOptionalId<Entry<Fields>>
  ) => Promise<Entry<Fields>>
  updateEntry: <Fields extends KeyValueMap = KeyValueMap>(
    data: Entry<Fields>
  ) => Promise<Entry<Fields>>
  publishEntry: <Fields extends KeyValueMap = KeyValueMap>(
    data: Entry<Fields>
  ) => Promise<Entry<Fields>>
  unpublishEntry: <Fields extends KeyValueMap = KeyValueMap>(
    data: Entry<Fields>
  ) => Promise<Entry<Fields>>
  archiveEntry: <Fields extends KeyValueMap = KeyValueMap>(
    data: Entry<Fields>
  ) => Promise<Entry<Fields>>
  unarchiveEntry: <Fields extends KeyValueMap = KeyValueMap>(
    data: Entry<Fields>
  ) => Promise<Entry<Fields>>
  deleteEntry: <Fields extends KeyValueMap = KeyValueMap>(data: Entry<Fields>) => Promise<void>
  getPublishedEntries: <Fields, Query extends SearchQuery = SearchQuery>(
    query?: Query
  ) => Promise<CollectionResponse<Entry<Fields>>>

  getAsset: (id: string) => Promise<Asset>
  getAssets: <Query extends SearchQuery = SearchQuery>(
    query?: Query
  ) => Promise<CollectionResponse<Asset>>
  createAsset: (data: WithOptionalId<Asset>) => Promise<Asset>
  updateAsset: (data: Asset) => Promise<Asset>
  deleteAsset: (data: Asset) => Promise<void>
  publishAsset: (data: Asset) => Promise<Asset>
  unpublishAsset: (data: Asset) => Promise<Asset>
  archiveAsset: (data: Asset) => Promise<Asset>
  processAsset: (data: Asset, locale: string) => Promise<Asset>
  unarchiveAsset: (data: Asset) => Promise<Asset>
  getPublishedAssets: <Query extends SearchQuery = SearchQuery>(
    query?: Query
  ) => Promise<CollectionResponse<Asset>>
  createUpload: (base64data: string) => Promise<void>
  waitUntilAssetProcessed: (assetId: string, locale: string) => Promise<Asset>

  /** Returns all users who belong to the space. */
  getUsers: () => Promise<CollectionResponse<User>>

  /** Returns editor interface for a given content type */
  getEditorInterface: (contentTypeId: string) => Promise<EditorInterface>
  /** Returns editor interfaces for a given environment */
  getEditorInterfaces: () => Promise<CollectionResponse<EditorInterface>>

  /* Returns a list of scheduled actions for a given entity */
  getEntityScheduledActions: (
    entityType: ContentEntityType,
    entityId: string
  ) => Promise<ScheduledAction[]>
  /* Returns a list of scheduled actions for the currenst space & environment */
  getAllScheduledActions: () => Promise<ScheduledAction[]>

  signRequest: (request: CanonicalRequest) => Promise<Record<string, string>>

  createTag: (id: string, name: string, visibility?: TagVisibility) => Promise<Tag>
  readTags: (skip: number, limit: number) => Promise<CollectionResponse<Tag>>
  updateTag: (id: string, name: string, version: number) => Promise<Tag>
  deleteTag: (id: string, version: number) => Promise<boolean>

  getTeams: (query: QueryOptions) => Promise<CollectionResponse<Team>>
}
