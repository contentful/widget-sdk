export type EntityType = 'Entry' | 'Asset'

export interface SpaceMembership {
  sys: {
    id: string
    type: string
  }
  admin: boolean
  roles: { name: string; description: string }[]
}

export interface User {
  sys: {
    id: string
    type: string
  }
  firstName: string
  lastName: string
  email: string
  avatarUrl: string
  spaceMembership: SpaceMembership
}

export interface Items {
  type: string
  linkType?: string
  validations?: Object[]
}

export interface Link {
  sys: {
    id: string
    type: string
    linkType: string
  }
}

export interface EntrySys {
  space: Link
  id: string
  type: string
  createdAt: string
  updatedAt: string
  environment: Link
  publishedVersion: number
  deletedVersion?: number
  archivedVersion?: number
  publishedAt: string
  firstPublishedAt: string
  createdBy: Link
  updatedBy: Link
  publishedCounter: number
  version: number
  publishedBy: Link
  contentType: Link
}

/* Field API */

export interface FieldAPI {
  /** The ID of a field is defined in an entry's content type. */
  id: string
  /** The current locale of a field the extension is attached to. */
  locale: string
  /** Holds the type of the field the extension is attached to. */
  type: string
  /** Indicates if a value for this field is required **/
  required: boolean
  /** A list of validations for this field that are defined in the content type. */
  validations: Object[]
  /** Defines the shape of array items **/
  items?: Items

  /** Gets the current value of the field and locale. */
  getValue: () => any
  /** Sets the value for the field and locale.  */
  setValue: (value: any) => Promise<any>
  /** Removes the value for the field and locale. */
  removeValue: () => Promise<void>
  /** Communicates to the web application if the field is in a valid state or not. */
  setInvalid: (value: boolean) => void

  /** Calls the callback every time the value of the field is changed by an external event or when setValue() is called. */
  onValueChanged: (callback: (value: any) => void) => Function
  /** Calls the callback when the disabled status of the field changes. */
  onIsDisabledChanged: (callback: Function) => Function
  /** Calls the callback immediately with the current validation errors and whenever the field is re-validated. */
  onSchemaErrorsChanged: (callback: Function) => Function
}

/* Entry API */

export interface EntryFieldAPI {
  /** The ID of a field is defined in an entry's content type. */
  id: string
  /** The list of locales for the field. */
  locales: string[]
  /** Holds the type of the field. */
  type: string
  /** Indicates if a value for this field is required **/
  required: boolean
  /** A list of validations for this field that are defined in the content type. */
  validations: Object[]
  /** Defines the shape of array items **/
  items?: Items

  /** Gets the current value of the field and locale. */
  getValue: (locale?: string) => any
  /** Sets the value for the field and locale.  */
  setValue: (value: any, locale?: string) => Promise<any>
  /** Removes the value for the field and locale. */
  removeValue: (locale?: string) => Promise<void>
  /** Calls the callback every time the value of the field is changed by an external event or when setValue() is called. */
  onValueChanged: {
    (callback: (value: any) => void): () => void
    (locale: string, callback: (value: any) => void): () => void
  }
  /** Calls the callback when the disabled status of the field changes. */
  onIsDisabledChanged: {
    (callback: (isDisabled: boolean) => void): () => void
    (locale: string, callback: (isDisabled: boolean) => void): () => void
  }

  getLocaleSpecificField: (locale: string) => FieldAPI
}

export interface EntryAPI {
  /** Returns metadata for an entry. */
  getSys: () => EntrySys
  /** Calls the callback with metadata every time that metadata changes. */
  onSysChanged: (callback: (sys: EntrySys) => void) => Function
  /** Allows to control the values of all other fields in the current entry. */
  fields: { [key: string]: EntryFieldAPI }
}

/* Content Type API */

export interface ContentTypeField {
  disabled: boolean
  id: string
  localized: boolean
  name: string
  omitted: boolean
  required: boolean
  type: string
  validations: Object[]
  linkType?: string
  items?: Items
}

export interface ContentType {
  sys: {
    type: string
    id: string
    version?: number
    space?: Link
    environment?: Link
    createdAt?: string
    createdBy?: Link
    updatedAt?: string
    updatedBy?: Link
  }
  fields: ContentTypeField[]
  name: string
  displayField: string
  description: string
}

export interface EditorInterface {
  sys: Object
  controls?: Array<{
    fieldId: string
    widgetId?: string
    widgetNamespace?: string
    settings?: Object
  }>
  sidebar?: Array<{
    widgetId: string
    widgetNamespace: string
    settings?: Object
    disabled?: boolean
  }>
  editor?: {
    widgetId: string
    widgetNamespace: string
    settings?: Object
  }
}

/* Space API */

export interface SearchQuery {
  order?: string
  skip?: number
  limit?: number
  [key: string]: any
}

export type CollectionResponse<T> = {
  items: T[]
  total: number
  skip: number
  limit: number
  sys: { type: string }
}

export interface SpaceAPI {
  getCachedContentTypes: () => ContentType[]
  getContentType: <T = Object>(id: string) => Promise<T>
  getContentTypes: <T = Object>() => Promise<CollectionResponse<T>>
  createContentType: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  updateContentType: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  deleteContentType: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>

  getEntry: <T = Object>(id: string) => Promise<T>
  getEntrySnapshots: <T = Object>(id: string) => Promise<CollectionResponse<T>>
  getEntries: <T = Object, InputArgs = SearchQuery>(
    query?: InputArgs
  ) => Promise<CollectionResponse<T>>
  createEntry: <T = Object, InputArgs = any>(contentTypeId: string, data: InputArgs) => Promise<T>
  updateEntry: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  publishEntry: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  unpublishEntry: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  archiveEntry: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  unarchiveEntry: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  deleteEntry: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  getPublishedEntries: <T = Object, InputArgs = SearchQuery>(
    query?: InputArgs
  ) => Promise<CollectionResponse<T>>

  getAsset: <T = Object>(id: string) => Promise<T>
  getAssets: <T = Object, InputArgs = SearchQuery>(
    query?: SearchQuery
  ) => Promise<CollectionResponse<T>>
  createAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  updateAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  deleteAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  publishAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  unpublishAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  archiveAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  processAsset: <T = Object, InputArgs = any>(data: InputArgs, locale: string) => Promise<T>
  unarchiveAsset: <T = Object, InputArgs = any>(data: InputArgs) => Promise<T>
  getPublishedAssets: <T = Object, InputArgs = SearchQuery>(
    query?: InputArgs
  ) => Promise<CollectionResponse<T>>
  createUpload: (base64data: string) => void
  waitUntilAssetProcessed: (assetId: string, locale: string) => void

  /** Returns all users who belong to the space. */
  getUsers: <T = Object>() => Promise<CollectionResponse<T>>

  /** Returns editor interface for a given content type */
  getEditorInterface: (contentTypeId: string) => Promise<EditorInterface>
  /** Returns editor interfaces for a given environment */
  getEditorInterfaces: () => Promise<CollectionResponse<EditorInterface>>

  /* Returns a list of scheduled actions for a given entity */
  getEntityScheduledActions: (
    entityType: EntityType,
    entityId: string
  ) => Promise<ScheduledAction[]>
  /* Returns a list of scheduled actions for the currenst space & environment */
  getAllScheduledActions: () => Promise<ScheduledAction[]>
}

/* Locales API */

export interface LocalesAPI {
  /** The default locale code for the current space. */
  default: string
  /** A list of locale codes of all locales available for editing in the current space. */
  available: string[]
  /** An object with keys of locale codes and values of corresponding human-readable locale names. */
  names: { [key: string]: string }
  /** An object with keys of locale codes and values of corresponding fallback locale codes. If there's no fallback then the value is undefined. */
  fallbacks: { [key: string]: string | undefined }
  /** An object with keys of locale codes and values of corresponding boolean value indicating if the locale is optional or not. */
  optional: { [key: string]: boolean }
  /** An object with keys of locale codes and values of corresponding information indicating if the locale is right-to-left or left-to-right language. */
  direction: { [key: string]: 'ltr' | 'rtl' }
}

/* Window API */

export interface WindowAPI {
  /** Sets the iframe height to the given value in pixels or using scrollHeight if value is not passed */
  updateHeight: (height?: number) => void
  /** Listens for DOM changes and updates height when the size changes. */
  startAutoResizer: () => void
  /** Stops resizing the iframe automatically. */
  stopAutoResizer: () => void
}

/* Scheduled Actions */

export enum PublicActionStatus {
  Scheduled = 'scheduled',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Canceled = 'canceled'
}

export type ScheduledActionActionType = 'publish' | 'unpublish'

export type ScheduledAction = {
  sys: {
    id: string
    type: 'ScheduledAction'
    createdAt: Date
    createdBy: Link
    canceledAt?: Date
    canceledBy?: Link
    space: {
      sys: {
        id: string
        linkType: 'Space'
        type: string
      }
    }
    status: PublicActionStatus
  }
  entity: {
    sys: {
      id: string
      linkType: EntityType
      type: string
    }
  }
  environment: {
    sys: {
      id: string
      linkType: 'Environment'
      type: string
    }
  }
  scheduledFor: {
    datetime: Date
  }
  action: ScheduledActionActionType
}

/* Dialogs API */

export interface OpenAlertOptions {
  title: string
  message: string
  confirmLabel?: string
  shouldCloseOnEscapePress?: boolean
  shouldCloseOnOverlayClick?: boolean
}

export type OpenConfirmOptions = OpenAlertOptions & {
  cancelLabel?: string
  intent?: 'primary' | 'positive' | 'negative'
}

export interface OpenCustomWidgetOptions {
  id?: string
  width?: number | 'small' | 'medium' | 'large' | 'fullWidth'
  minHeight?: number | string
  allowHeightOverflow?: boolean
  position?: 'center' | 'top'
  title?: string
  shouldCloseOnOverlayClick?: boolean
  shouldCloseOnEscapePress?: boolean
  parameters?: Object
}

export interface DialogsAPI {
  /** Opens a simple alert window (which can only be closed). */
  openAlert: (options: OpenAlertOptions) => Promise<boolean>
  /** Opens a confirmation window. A user can either confirm or cancel the dialog. */
  openConfirm: (options: OpenConfirmOptions) => Promise<boolean>
  /** Opens a prompt window. A user can either provide a string input or cancel the dialog. */
  openPrompt: (
    options: OpenConfirmOptions & {
      defaultValue?: string
    }
  ) => Promise<string | boolean>
  /** Opens an extension in a dialog. */
  openExtension: (options: OpenCustomWidgetOptions) => Promise<any>
  /** Opens the current app in a dialog */
  openCurrentApp: (options?: Omit<OpenCustomWidgetOptions, 'id'>) => Promise<any>
  /** Opens a dialog for selecting a single entry. */
  selectSingleEntry: <T = Object>(options?: {
    locale?: string
    contentTypes?: string[]
  }) => Promise<T | null>
  /** Opens a dialog for selecting multiple entries. */
  selectMultipleEntries: <T = Object>(options?: {
    locale?: string
    contentTypes?: string[]
    min?: number
    max?: number
  }) => Promise<T[] | null>
  /** Opens a dialog for selecting a single asset. */
  selectSingleAsset: <T = Object>(options?: {
    locale?: string
    mimetypeGroups?: string[]
  }) => Promise<T | null>
  /** Opens a dialog for selecting multiple assets. */
  selectMultipleAssets: <T = Object>(options?: {
    locale?: string
    min?: number
    max?: number
    mimetypeGroups?: string[]
  }) => Promise<T[] | null>
}

/* Navigator API */

export interface NavigatorAPIOptions {
  /** use `waitForClose` if you want promise to be resolved only after slide in editor is closed */
  slideIn?: boolean | { waitForClose: boolean }
}

export interface PageExtensionOptions {
  /** If included, you can navigate to a different page extension. If omitted, you will navigate within the current extension. */
  id?: string
  /** Navigate to a path within your page extension. */
  path?: string
}

export interface AppPageLocationOptions {
  /** A path to navigate to within your app's page location. */
  path?: string
}

/** Information about current value of the navigation status. */
export interface NavigatorPageResponse {
  /** Will be true if navigation was successfully executed by the web app. */
  navigated: boolean
  /** The path that was navigated to by the web app. */
  path: string
}

export interface NavigatorSlideInfo {
  newSlideLevel: number
  oldSlideLevel: number
}

export interface NavigatorOpenResponse<T> {
  navigated: boolean
  entity: T
  slide?: NavigatorSlideInfo
}

export interface NavigatorAPI {
  /** Opens an existing entry in the current Web App session. */
  openEntry: <T = Object>(
    entryId: string,
    options?: NavigatorAPIOptions
  ) => Promise<NavigatorOpenResponse<T>>
  /** Opens an existing asset in the current Web App session. */
  openAsset: <T = Object>(
    assetId: string,
    options?: NavigatorAPIOptions
  ) => Promise<NavigatorOpenResponse<T>>
  /** Opens a new entry in the current Web App session. */
  openNewEntry: <T = Object>(
    contentTypeId: string,
    options?: NavigatorAPIOptions
  ) => Promise<NavigatorOpenResponse<T>>
  /** Opens a new asset in the current Web App session. */
  openNewAsset: <T = Object>(options: NavigatorAPIOptions) => Promise<NavigatorOpenResponse<T>>
  /** Navigates to a page extension in the current Web App session. Calling without `options` will navigate to the home route of your page extension. */
  openPageExtension: (options?: PageExtensionOptions) => Promise<NavigatorPageResponse>
  /** Navigates to the app's page location. */
  openCurrentAppPage: (options?: AppPageLocationOptions) => Promise<NavigatorPageResponse>
  /** Navigates to a bulk entry editor */
  openBulkEditor: (
    entryId: string,
    options: {
      /** ID of the reference field */
      fieldId: string
      /** Editable locale */
      locale: string
      /** Focused index */
      index: number
    }
  ) => Promise<{
    navigated: boolean
    slide?: NavigatorSlideInfo
  }>
  onSlideInNavigation: (fn: (slide: NavigatorSlideInfo) => void) => Function
}

/* Notifier API */

export interface NotifierAPI {
  /** Displays a success notification in the notification area of the Web App. */
  success: (message: string) => void
  /** Displays an error notification in the notification area of the Web App. */
  error: (message: string) => void
}

/* Location API */

export interface LocationAPI {
  /** Checks the location in which your extension is running */
  is: (type: string) => boolean
}

/* Parameters API */

export interface ParametersAPI {
  installation: Object
  instance: Object
  invocation?: Object
}

/* IDs */

export interface IdsAPI {
  user: string
  extension: string
  app?: string
  space: string
  environment: string
  field: string
  entry: string
  contentType: string
}

export interface SharedEditorSDK {
  editor: {
    editorInterface: EditorInterface
    onLocaleSettingsChanged: (
      callback: (value: {
        mode: 'multi' | 'single'
        focused?: string
        active?: Array<string>
      }) => any
    ) => Function
    onShowDisabledFieldsChanged: (callback: (value: boolean) => any) => Function
  }
}

export interface BaseExtensionSDK {
  /** Allows to read and update the value of any field of the current entry and to get the entry's metadata */
  entry: EntryAPI
  /** Information about the content type of the entry. */
  contentType: ContentType
  /** Exposes methods that allow the extension to read and manipulate a wide range of objects in the space. */
  space: SpaceAPI
  /** Information about the current user and roles */
  user: User
  /** Information about the current locales */
  locales: LocalesAPI
  /** Methods for opening UI dialogs: */
  dialogs: DialogsAPI
  /** Methods for navigating between entities stored in a Contentful space. */
  navigator: NavigatorAPI
  /** Methods for displaying notifications. */
  notifier: NotifierAPI
  /** Exposes extension configuration parameters */
  parameters: ParametersAPI
  /** Exposes method to identify extension's location */
  location: LocationAPI
}

export type EditorExtensionSDK = BaseExtensionSDK &
  SharedEditorSDK & {
    /** A set of IDs actual for the extension */
    ids: Pick<IdsAPI, 'entry' | 'contentType' | 'environment' | 'space' | 'extension' | 'user'>
  }

export type SidebarExtensionSDK = BaseExtensionSDK &
  SharedEditorSDK & {
    /** A set of IDs actual for the extension */
    ids: Pick<IdsAPI, 'entry' | 'contentType' | 'environment' | 'space' | 'extension' | 'user'>
    /** Methods to update the size of the iframe the extension is contained within.  */
    window: WindowAPI
  }

export type FieldExtensionSDK = BaseExtensionSDK &
  SharedEditorSDK & {
    /** A set of IDs actual for the extension */
    ids: IdsAPI
    /** Gives you access to the value and metadata of the field the extension is attached to. */
    field: FieldAPI
    /** Methods to update the size of the iframe the extension is contained within.  */
    window: WindowAPI
  }

export type DialogExtensionSDK = BaseExtensionSDK & {
  /** A set of IDs actual for the extension */
  ids: Pick<IdsAPI, 'environment' | 'space' | 'extension' | 'user'>
  /** Closes the dialog and resolves openExtension promise with data */
  close: (data?: any) => void
  /** Methods to update the size of the iframe the extension is contained within.  */
  window: WindowAPI
}

export type PageExtensionSDK = BaseExtensionSDK & {
  /** A set of IDs actual for the extension */
  ids: Pick<IdsAPI, 'environment' | 'space' | 'extension' | 'user'>
}

export interface AppConfigAPI {
  /** Tells the web app that the app is loaded */
  setReady: () => Promise<void>
  /** Returns true if an App is installed **/
  isInstalled: () => Promise<boolean>
  /** Returns parameters of an App, null otherwise **/
  getParameters: <T = Object>() => Promise<null | T>
  /** Registers a handler to be called to produce parameters for an App **/
  onConfigure: (handler: Function) => Promise<void>
  /** Registers a handler to be called once configuration was finished **/
  onConfigurationCompleted: (handler: Function) => Promise<void>
}

export type AppExtensionSDK = BaseExtensionSDK & {
  /** A set of IDs actual for the app */
  ids: Pick<IdsAPI, 'environment' | 'space' | 'app' | 'user'>
  app: AppConfigAPI
}

export type KnownSDK =
  | FieldExtensionSDK
  | SidebarExtensionSDK
  | DialogExtensionSDK
  | EditorExtensionSDK
  | PageExtensionSDK
  | AppExtensionSDK

export interface Locations {
  LOCATION_ENTRY_FIELD: 'entry-field'
  LOCATION_ENTRY_FIELD_SIDEBAR: 'entry-field-sidebar'
  LOCATION_ENTRY_SIDEBAR: 'entry-sidebar'
  LOCATION_DIALOG: 'dialog'
  LOCATION_ENTRY_EDITOR: 'entry-editor'
  LOCATION_PAGE: 'page'
  LOCATION_APP_CONFIG: 'app-config'
}
