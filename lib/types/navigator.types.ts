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
  entity?: T
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
  openAppConfig: () => Promise<void>
  openEntriesList: () => Promise<void>
  openAssetsList: () => Promise<void>
  onSlideInNavigation: (fn: (slide: NavigatorSlideInfo) => void) => Function
}
