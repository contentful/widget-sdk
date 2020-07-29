export enum ChannelMethod {
  CallSpaceMethod = 'callSpaceMethod',
  SetHeight = 'setHeight',
  Notify = 'notify',
  NavigateToPage = 'navigateToPage',
  NavigateToPageExtension = 'navigateToPageExtension',
  NavigateToBulkEditor = 'navigateToBulkEditor',
  NavigateToContentEntity = 'navigateToContentEntity',
  OpenDialog = 'openDialog',
  CloseDialog = 'closeDialog',
  CheckAccess = 'checkAccess',
  SetValue = 'setValue',
  RemoveValue = 'removeValue',
  SetInvalid = 'setInvalid',
}

export enum ChannelEvent {
  Connect = 'connect',
  SysChanged = 'sysChanged',
  LocaleSettingsChanged = 'localeSettingsChanged',
  ShowDisabledFieldsChanged = 'showDisabledFieldsChanged',
  OnSlideInNavigation = 'onSlideInNavigation',
  ValueChanged = 'valueChanged',
  IsDisabledChangedForFieldLocale = 'isDisabledChangedForFieldLocale',
  SchemaErrorsChangedForFieldLocale = 'schemaErrorsChangedForFieldLocale',
}

export interface IncomingMessage {
  data: {
    source: string;
    method: ChannelMethod;
    id: string;
    params: any[];
  };
}

export interface OutgoingResultMessage {
  id: string;
  result: any;
}

export interface OutgoingErrorMessage {
  id: string;
  error: {
    code?: string | number;
    message?: string;
    data?: any;
  };
}

export interface OutgoingMethodCallMessage {
  method: ChannelEvent;
  params: any[];
}

export type OutgoingMessage =
  | OutgoingResultMessage
  | OutgoingErrorMessage
  | OutgoingMethodCallMessage;

export type Handler = (...args: any[]) => any | Promise<any>;
