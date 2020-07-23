export { makeCallSpaceMethodHandler } from './CallSpaceMethodHandler';
export { makeNotifyHandler } from './NotifyHandler';
export { makeOpenDialogHandler } from './OpenDialogHandler';
export {
  makeNavigateToBulkEditorHandler,
  makeNavigateToContentEntityHandler,
  makeNavigateToPageHandler,
} from './NavigateToHandler';
export { makeCheckAccessHandler } from './CheckAccessHandler';

export type DialogsAPI = import('./OpenDialogHandler').DialogsAPI;
export type NavigatorAPI = import('./NavigateToHandler').NavigatorAPI;
export type AccessAPI = import('./CheckAccessHandler').AccessAPI;
