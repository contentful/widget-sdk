export enum FLAGS {
  ADD_TO_RELEASE = 'feature-pulitzer-05-2020-add-to-release',
  NEW_FIELD_DIALOG = 'react-migration-new-content-type-field-dialog',
  SSO_SETUP_NO_REDUX = 'feature-hejo-08-2020-sso-setup-no-redux',
  ENTITLEMENTS_API = 'feature-hejo-11-2020-entitlements-api',
  CREATE_SPACE_FOR_SPACE_PLAN = 'feature-hejo-12-2020-create-space-for-space-plan',
  WORKFLOWS_APP = 'ext-09-2020-enable-workflows',
  COMPOSE_LAUNCH_PURCHASE = 'feature-ahoy-11-2020-compose-launch-purchase',
  PATCH_ENTRY_UPDATES = 'feature-penguin-12-2020-patch-entry-updates',
  COMPOSE_APP_LISTING_EAP = 'feature-ext-12-2020-contentful-apps-compose-eap',
  LAUNCH_APP_LISTING_EAP = 'feature-ext-12-2020-contentful-apps-launch-eap',
  REACT_MIGRATION_CT = 'react-migration-10-2020-content-type-editor',
  APP_HOSTING_UI = 'feature-extensibility-03-2021-app-hosting-ui',
  HIGH_VALUE_LABEL = 'feature-hejo-03-2021-high-value-label',
  EXPERIMENT_A_A = 'test-growth-04-2021-a-a-exp',
  V1_MIGRATION_2021_WARNING = 'feature-hejo-04-2021-v1-migration',
  REQUEST_RETRY_EXPERIMENT = 'dev-workflows-02-2021-request-retry-experiment',
  ENVIRONMENT_POLICIES = 'feature-dev-workflows-04-2021-environment-policies',
  NEW_ONBOARDING_FLOW = 'feature-growth-04-2021-new-onboarding-flow',
  RECOVERABLE_ONBOARDING_FLOW = 'feature-growth-04-2021-recoverable-onboarding-flow',
  EXPERIMENT_ONBOARDING_MODAL = 'test-growth-05-2021-onboarding-modal',
  EXPERIMENT_NEW_COWORKER_INVITE_CARD = 'test-growth-06-2021-new-coworker-invite-card',
  EXPERIENCE_SDK_PAGE_LOCATION = 'feature-ext-05-2021-experience-sdk-page-location',
  RICH_TEXT_TABLES = 'feature-shelley-05-2021-rich-text-tables',
  EXPERIENCE_SDK_ENTRY_EDITOR_LOCATION = 'feature-ext-05-2021-experience-sdk-entry-editor-location',
  EXPERIENCE_SDK_APP_CONFIG_LOCATION = 'feature-ext-05-2021-experience-sdk-app-config-location',
  PREASSIGN_ONBOARDING_FLOW = 'feature-growth-06-2021-preassign-onboarding-flow',
  EXPERIMENT_PREASSIGN_ONBOARDING_FLOW = 'test-growth-06-2021-preassign-onboarding-flow',
  INITIAL_FIELD_VALUES = 'dante-06-2021-initial-field-values',

  // So that we can test the fallback mechanism without needing to rely on an actual
  // flag above, we use these special flags.
  __FLAG_FOR_UNIT_TESTS__ = 'test-flag',
  __SECOND_FLAG_FOR_UNIT_TEST__ = 'test-flag-2',
}

export const fallbackValues = {
  [FLAGS.ADD_TO_RELEASE]: false,
  [FLAGS.NEW_FIELD_DIALOG]: false,
  [FLAGS.SSO_SETUP_NO_REDUX]: false,
  [FLAGS.ENTITLEMENTS_API]: false,
  [FLAGS.CREATE_SPACE_FOR_SPACE_PLAN]: false,
  [FLAGS.WORKFLOWS_APP]: false,
  [FLAGS.COMPOSE_LAUNCH_PURCHASE]: false,
  [FLAGS.PATCH_ENTRY_UPDATES]: false,
  [FLAGS.COMPOSE_APP_LISTING_EAP]: false,
  [FLAGS.LAUNCH_APP_LISTING_EAP]: false,
  [FLAGS.APP_HOSTING_UI]: false,
  [FLAGS.HIGH_VALUE_LABEL]: false,
  [FLAGS.ENVIRONMENT_POLICIES]: false,
  [FLAGS.V1_MIGRATION_2021_WARNING]: false,
  [FLAGS.NEW_ONBOARDING_FLOW]: false,
  [FLAGS.RECOVERABLE_ONBOARDING_FLOW]: false,
  [FLAGS.EXPERIENCE_SDK_PAGE_LOCATION]: false,
  [FLAGS.RICH_TEXT_TABLES]: false,
  [FLAGS.EXPERIMENT_ONBOARDING_MODAL]: null,
  [FLAGS.EXPERIENCE_SDK_APP_CONFIG_LOCATION]: false,
  [FLAGS.EXPERIENCE_SDK_ENTRY_EDITOR_LOCATION]: false,
  [FLAGS.PREASSIGN_ONBOARDING_FLOW]: false,
  [FLAGS.INITIAL_FIELD_VALUES]: false,

  [FLAGS.REACT_MIGRATION_CT]: false,

  [FLAGS.REQUEST_RETRY_EXPERIMENT]: false,

  [FLAGS.EXPERIMENT_A_A]: null,
  [FLAGS.EXPERIMENT_ONBOARDING_MODAL]: null,
  [FLAGS.EXPERIMENT_NEW_COWORKER_INVITE_CARD]: null,
  [FLAGS.EXPERIMENT_PREASSIGN_ONBOARDING_FLOW]: null,

  // See above
  [FLAGS.__FLAG_FOR_UNIT_TESTS__]: 'fallback-value',
  [FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__]: 'fallback-value-2',
};

export function ensureFlagsHaveFallback() {
  const flagNames = Object.values(FLAGS);
  const missing: string[] = [];

  for (const flagName of flagNames) {
    if (!(flagName in fallbackValues)) {
      missing.push(flagName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Feature flag(s) are missing fallback values. Add fallback values for the following flag(s): ${missing.join(
        ', '
      )}`
    );
  }
}
