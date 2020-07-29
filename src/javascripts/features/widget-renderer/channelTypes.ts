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

export interface IncomingMessage {
  data: {
    source: string;
    method: string;
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
  method: string;
  params: any[];
}

export type OutgoingMessage = OutgoingResultMessage | OutgoingErrorMessage | OutgoingMethodCallMessage;

export type Handler = (...args: any[]) => any | Promise<any>;
