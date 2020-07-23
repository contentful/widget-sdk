export { makeCallSpaceMethodHandler } from './CallSpaceMethodHandler';
export { makeNotifyHandler } from './NotifyHandler';
export { makeOpenDialogHandler } from './OpenDialogHandler';
export {
  makeNavigateToBulkEditorHandler,
  makeNavigateToContentEntityHandler,
  makeNavigateToPageHandler,
} from './NavigateToHandler';
export { makeCheckAccessHandler } from './CheckAccessHandler';
export { makeSetValueHandler, makeRemoveValueHandler } from './FieldHandler';

export type DialogsAPI = import('./OpenDialogHandler').DialogsAPI;
export type NavigatorAPI = import('./NavigateToHandler').NavigatorAPI;
export type AccessAPI = import('./CheckAccessHandler').AccessAPI;
export type FieldAPI = import('./FieldHandler').FieldAPI;
