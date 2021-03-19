export enum LEVEL {
  ALL = 'all',
  DISABLED = 'disabled',
  MIGRATING = 'migrating',
  UNPUBLISHED = 'unpublished',
}

export const levelDescription = {
  [LEVEL.MIGRATING]: 'Preparation mode',
  [LEVEL.UNPUBLISHED]: 'Unpublished assets protected',
  [LEVEL.ALL]: 'All assets protected',
};

export const confirmLabelByLevel = {
  [LEVEL.MIGRATING]:
    'I understand that all of my assets will become immediately publicly accessible.',
  [LEVEL.UNPUBLISHED]:
    'I understand that all publicly accessible unpublished asset URLs will cease to function within 48 hours, and confirm that my site and tooling is configured to sign secure asset URLs before use.',
  [LEVEL.ALL]:
    'I understand that all publicly accessible asset URLs will cease to function within 48 hours, and confirm that my site and tooling is configured to sign secure asset URLs before use.',
  [LEVEL.DISABLED]:
    'I understand that all of my assets will become immediately publicly accessible and secure URLs will cease to function.',
};
