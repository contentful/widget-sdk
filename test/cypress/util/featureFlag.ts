// List of feature flags from LaunchDarkly

export enum FeatureFlag {
  APPS = 'feature-te-11-2018-apps',
  CONTENT_WORKFLOW_TASKS = 'feature-05-2019-content-workflows-tasks',
  ENVIRONMENTS = 'feature-dv-11-2017-environments',
  ENVIRONMENTS_USAGE_ENFORCEMENTS = 'feature-dw-04-2019-environment-usage-enforcements',
  ENTRY_ACTIVITY = 'feature-pul-03-2019-entry-activity',
  ENTRY_COMMENTS = 'feature-04-2019-entry-comments',
  MODERN_STACK_ONBOARDING = 'feature-dl-05-2018-modern-stack-onboarding',
  RICH_TEXT_COMMANDS = 'feature-03-2019-richt-text-commands',
  SCHEDULED_PUBLICATION = 'feature-pul-04-2019-scheduled-publication-enabled',
  TEAMS = 'feature-bv-11-2018-teams',
  TEAMS_FOR_MEMBERS = 'feature-bv-01-2019-teams-for-members',
  TEAMS_SPACE_MEMBERSHIP = 'feature-bv-01-2019-team-space-memberships',
  QUICK_NAVIGATION = 'feature-ht-04-2019-quick-navigation',
  DEFAULT = ENVIRONMENTS
}
