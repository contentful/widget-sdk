export enum ReadOnlyApi {
  Navigate,
  Dialog,
  Entry,
  EntryField,
  Space,
}

enum ReadOnlyErrorCode {
  CannotNavigate = 'READ_ONLY_CANNOT_NAVIGATE',
  CannotOpenDialog = 'READ_ONLY_CANNOT_OPEN_DIALOG',
  CannotModifyEntry = 'READ_ONLY_CANNOT_MODIFY_ENTRY',
  CannotInvokeMethod = 'READ_ONLY_CANNOT_INVOKE_METHOD',
}

enum ReadOnlyErrorMessage {
  CannotNavigate = 'Cannot navigate in read-only mode',
  CannotOpenDialog = 'Cannot open dialogs in read-only mode',
  CannotModifyEntry = 'Cannot modify entries in read-only mode',
  CannotInvokeMethod = 'Cannot invoke method read-only mode',
}

export const makeReadOnlyApiError = (api: ReadOnlyApi, details?: string) => {
  switch (api) {
    case ReadOnlyApi.Dialog:
      return {
        ...new Error(ReadOnlyErrorMessage.CannotOpenDialog),
        code: ReadOnlyErrorCode.CannotOpenDialog,
      };
    case ReadOnlyApi.Navigate:
      return {
        ...new Error(ReadOnlyErrorMessage.CannotNavigate),
        code: ReadOnlyErrorCode.CannotNavigate,
      };
    case ReadOnlyApi.Entry:
    case ReadOnlyApi.EntryField:
      return {
        ...new Error(ReadOnlyErrorMessage.CannotModifyEntry),
        code: ReadOnlyErrorCode.CannotModifyEntry,
      };
    case ReadOnlyApi.Space:
      return {
        ...new Error(ReadOnlyErrorMessage.CannotInvokeMethod),
        code: ReadOnlyErrorCode.CannotInvokeMethod,
        details,
      };
  }
};
