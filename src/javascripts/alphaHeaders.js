export const SUBSCRIPTIONS_API = 'subscriptions-api'; // Dec 14, 2017
export const TEAMS_API = 'teams-api'; // Dec 05, 2018
export const COMMENTS_API = 'comments-api'; // Apr 30, 2019
export const TASKS_DASHBOARD = 'tasks-dashboard'; // Oct 23, 2019
export const MFA_API = 'mfa-api'; // Oct 23, 2019

// Get an object with the alpha feature header with one or more features
export const getAlphaHeader = (...features) => ({
  'x-contentful-enable-alpha-feature': features.join()
});
