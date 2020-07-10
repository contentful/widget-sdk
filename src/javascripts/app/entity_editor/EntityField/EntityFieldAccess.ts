const DENIED = { type: 'DENIED', denied: true, disabled: true } as const;
const EDITING_DISABLED = {
  type: 'EDITING_DISABLED',
  // eslint-disable-next-line @typescript-eslint/camelcase
  editing_disabled: true,
  disabled: true,
} as const;
const OCCUPIED = { type: 'OCCUPIED', occupied: true, disabled: true } as const;
const EDITABLE = { type: 'EDITABLE', editable: true } as const;
const DISCONNECTED = { type: 'DISCONNECTED', disconnected: true, disabled: true } as const;

export type FieldAccessType =
  | typeof DENIED
  | typeof EDITING_DISABLED
  | typeof OCCUPIED
  | typeof EDITABLE
  | typeof DISCONNECTED;

export const FieldAccess = {
  DENIED,
  EDITING_DISABLED,
  OCCUPIED,
  EDITABLE,
  DISCONNECTED,
};
