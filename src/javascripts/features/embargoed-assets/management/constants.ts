// helper to make union types of the const map
// is a convenience for `typeof T[keyof typeof T]`
type Values<T> = T[keyof T];

export const SWITCHABLE_LEVEL = {
  MIGRATING: 'migrating',
  UNPUBLISHED: 'unpublished',
  ALL: 'all',
} as const;
export const DISABLED_LEVEL = {
  DISABLED: 'disabled',
} as const;
export const ENABLED_LEVEL = {
  ENABLED: 'enabled',
} as const;

export const LEVEL = { ...SWITCHABLE_LEVEL, ...DISABLED_LEVEL, ...ENABLED_LEVEL } as const;
export type LEVEL = typeof SWITCHABLE_LEVEL | typeof DISABLED_LEVEL | typeof ENABLED_LEVEL;

export type SwitchableLevel = Values<typeof SWITCHABLE_LEVEL>;
export type DisabledLeveL = Values<typeof DISABLED_LEVEL>;
export type EnabledLevel = Values<typeof ENABLED_LEVEL>;
export type Level = SwitchableLevel | DisabledLeveL;

export type SwitchableLevels = Array<SwitchableLevel>;
export const SWITCHABLE_LEVEL_VALUES: SwitchableLevels = Object.values(SWITCHABLE_LEVEL);

export type LevelToUrlSecurity = Record<SwitchableLevel, LevelToUrlSecurityApis>;
type LevelToUrlSecurityApis = {
  cma: boolean;
  cpa: boolean;
  cda: boolean;
};

type LevelDescription = Record<SwitchableLevel, string>;
export const levelDescription: LevelDescription = {
  [LEVEL.MIGRATING]: 'Preparation mode',
  [LEVEL.UNPUBLISHED]: 'Unpublished assets protected',
  [LEVEL.ALL]: 'All assets protected',
};

type ConfirmLabelByLevel = Record<Level, string>;
export const confirmLabelByLevel: ConfirmLabelByLevel = {
  [LEVEL.MIGRATING]:
    'I understand that all of my assets will become immediately publicly accessible.',
  [LEVEL.UNPUBLISHED]:
    'I understand that all publicly accessible unpublished asset URLs will cease to function within 48 hours, and confirm that my site and tooling is configured to sign secure asset URLs before use.',
  [LEVEL.ALL]:
    'I understand that all publicly accessible asset URLs will cease to function within 48 hours, and confirm that my site and tooling is configured to sign secure asset URLs before use.',
  [LEVEL.DISABLED]:
    'I understand that all of my assets will become immediately publicly accessible and secure URLs will cease to function.',
};
