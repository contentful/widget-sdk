export enum LEVEL {
  ALL = 'all',
  DISABLED = '',
  MIGRATING = 'migrating',
  UNPUBLISHED = 'unpublished',
}

export const LevelDescription = {
  [LEVEL.MIGRATING]: 'Preparation mode',
  [LEVEL.UNPUBLISHED]: 'Unpublished assets protected',
  [LEVEL.ALL]: 'All assets protected',
};
