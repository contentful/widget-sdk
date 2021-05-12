import { renderAppsNavigationItem } from 'features/apps';
import { routes } from 'core/react-routing';

const makeRef = (ref, isUnscopedRoute) =>
  isUnscopedRoute ? `spaces.detail.${ref}` : `spaces.environment.${ref}`;

const makeReactRouterRef = (route: keyof typeof routes, withEnvironment: boolean) => {
  // @ts-expect-error ignore "params" arg, we expect only .list routes
  const state = routes[route]({ withEnvironment });
  return {
    sref: state.path,
    srefParams: state.params,
    rootSref: state.path,
  };
};

type Props = {
  canNavigateTo: (section: string) => boolean;
  usageEnabled: boolean;
  hasOrgTeamFeature: boolean;
  useSpaceEnvironment: boolean;
  isUnscopedRoute: boolean;
  contentTagsEnabled: boolean;
  canManageSpace: boolean;
};

export function getSpaceNavigationItems({
  canNavigateTo,
  usageEnabled,
  hasOrgTeamFeature,
  useSpaceEnvironment,
  isUnscopedRoute,
  contentTagsEnabled,
  canManageSpace,
}: Props) {
  const withEnvironment = !isUnscopedRoute;

  const dropdownItems = {
    locales: {
      if: canNavigateTo('locales'),
      dataViewType: 'spaces-settings-locales',
      title: 'Locales',
      ...makeReactRouterRef('locales.list', withEnvironment),
    },
    extensions: {
      if: canNavigateTo('extensions'),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions',
      ...makeReactRouterRef('extensions.list', withEnvironment),
    },
    tags: {
      if: contentTagsEnabled && canNavigateTo('tags'),
      dataViewType: 'spaces-settings-tags',
      title: 'Tags',
      tagLabel: 'new',
      ...makeReactRouterRef('tags', withEnvironment),
    },
    settings: {
      if: canNavigateTo('settings'),
      dataViewType: 'spaces-settings-space',
      title: 'General settings',
      ...makeReactRouterRef('settings.space', withEnvironment),
    },
    users: {
      if: canNavigateTo('users'),
      dataViewType: 'spaces-settings-users',
      title: 'Users',
      ...makeReactRouterRef('users.list', withEnvironment),
    },
    teams: {
      if: hasOrgTeamFeature && canNavigateTo('teams'),
      dataViewType: 'spaces-settings-teams',
      label: 'new',
      title: 'Teams',
      ...makeReactRouterRef('teams.list', withEnvironment),
    },
    embargoedAssets: {
      if: canNavigateTo('embargoedAssets'),
      dataViewType: 'spaces-settings-embargoedAssets',
      title: 'Embargoed assets',
      ...makeReactRouterRef('settings.embargoedAssets', withEnvironment),
    },
    roles: {
      if: canNavigateTo('roles'),
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions',
      ...makeReactRouterRef('roles.list', withEnvironment),
    },
    environments: {
      if: canNavigateTo('settings.environments'),
      dataViewType: 'spaces-settings-environments',
      title: 'Environments',
      ...makeReactRouterRef('settings.environments', withEnvironment),
    },
    keys: {
      if: canNavigateTo('apiKey'),
      sref: makeRef('api.keys.list', isUnscopedRoute),
      rootSref: makeRef('api', isUnscopedRoute),
      dataViewType: 'spaces-settings-api',
      title: 'API keys',
    },
    webhooks: {
      if: canNavigateTo('webhooks'),
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks',
      ...makeReactRouterRef('webhooks.list', withEnvironment),
    },
    previews: {
      if: canNavigateTo('previews'),
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      srefOptions: {
        reload: useSpaceEnvironment,
      },
      ...makeReactRouterRef('content_preview.list', withEnvironment),
    },
    usage: {
      if: usageEnabled && canNavigateTo('usage'),
      dataViewType: 'spaces-settings-usage',
      title: 'Usage',
      srefOptions: {
        reload: useSpaceEnvironment,
      },
      ...makeReactRouterRef('usage', withEnvironment),
    },
  };

  const envSettingsDropdown = [
    {
      // If the user cannot access locales but has manager role, do not show the
      // environment settings section.
      if: canNavigateTo('locales'),
      separator: true,
      label: 'Environment settings',
      tooltip: 'These settings apply only to the environment you’ve currently selected.',
    },
    dropdownItems.locales,
    dropdownItems.extensions,
    dropdownItems.tags,
    {
      separator: true,
      label: 'Space settings',
      tooltip: 'These settings apply to the space and all its environments.',
    },
    dropdownItems.settings,
    dropdownItems.users,
    dropdownItems.teams,
    dropdownItems.roles,
    dropdownItems.environments,
    dropdownItems.keys,
    dropdownItems.embargoedAssets,
    dropdownItems.webhooks,
    dropdownItems.previews,
    dropdownItems.usage,
  ].filter((item) => item.if !== false);

  const spaceSettingsDropdown = [
    dropdownItems.tags,
    dropdownItems.settings,
    dropdownItems.locales,
    dropdownItems.users,
    dropdownItems.teams,
    dropdownItems.roles,
    dropdownItems.keys,
    dropdownItems.webhooks,
    dropdownItems.extensions,
    dropdownItems.previews,
    dropdownItems.usage,
  ].filter((item) => item.if !== false);

  return [
    !useSpaceEnvironment || isUnscopedRoute
      ? {
          if: canNavigateTo('spaceHome'),
          sref: 'spaces.detail.home',
          dataViewType: 'space-home',
          navIcon: 'Home',
          title: 'Space home',
        }
      : {
          if: canNavigateTo('spaceHome'),
          disabled: true,
          tooltip: 'The space home is only available in the master environment.',
          navIcon: 'Home',
          title: 'Space home',
        },
    {
      if: canNavigateTo('contentType'),
      sref: makeRef('content_types.list', isUnscopedRoute),
      rootSref: makeRef('content_types', isUnscopedRoute),
      dataViewType: 'content-type-list',
      navIcon: 'ContentModel',
      title: 'Content model',
    },
    {
      if: canNavigateTo('entry'),
      sref: makeRef('entries.list', isUnscopedRoute),
      rootSref: makeRef('entries', isUnscopedRoute),
      dataViewType: 'entry-list',
      navIcon: 'Content',
      title: 'Content',
    },
    {
      if: canNavigateTo('asset'),
      sref: makeRef('assets.list', isUnscopedRoute),
      rootSref: makeRef('assets', isUnscopedRoute),
      dataViewType: 'asset-list',
      navIcon: 'Media',
      title: 'Media',
    },
    {
      if: canNavigateTo('apps'),
      dataViewType: 'apps',
      navIcon: 'Apps',
      rootSref: makeRef('apps', isUnscopedRoute),
      title: 'Apps',
      render: (item) => renderAppsNavigationItem(item, { isUnscopedRoute, canManageSpace }),
    },
    {
      if: useSpaceEnvironment ? envSettingsDropdown.length > 0 : spaceSettingsDropdown.length > 0,
      dataViewType: 'space-settings',
      rootSref: makeRef('settings', isUnscopedRoute),
      navIcon: 'Settings',
      title: 'Settings',
      children: useSpaceEnvironment ? envSettingsDropdown : spaceSettingsDropdown,
    },
  ].filter((item) => item.if !== false);
}
