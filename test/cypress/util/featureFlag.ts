// List of feature flags from LaunchDarkly

export enum FeatureFlag {
  ENVIRONMENTS = 'feature-dv-11-2017-environments',
  ENVIRONMENTS_USAGE_ENFORCEMENTS = 'feature-dw-04-2019-environment-usage-enforcements',
  ENTRY_COMMENTS = 'feature-04-2019-entry-comments',
  MODERN_STACK_ONBOARDING = 'feature-dl-05-2018-modern-stack-onboarding',
  SCHEDULED_PUBLICATION = 'feature-pul-04-2019-scheduled-publication-enabled',
  TEAMS_SPACE_MEMBERSHIP = 'feature-bv-01-2019-team-space-memberships',
  QUICK_NAVIGATION = 'feature-ht-04-2019-quick-navigation',
  DEFAULT = ENVIRONMENTS,
  TWO_FA = 'feature-ogg-10-2019-2fa'
}
