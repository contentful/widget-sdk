import {
  WebhookListRoute,
  WebhookNewRoute,
  WebhookEditRoute,
  WebhookCallRoute,
} from 'features/webhooks';

import { ExtensionsListRoute } from 'features/extensions-management';
import { ExtensionEditorRoute } from 'features/extensions-management';
import RoleEditorRoute from './roles_permissions/routes/RoleEditorRoute';
import RolesListRoute from './roles_permissions/routes/RolesListRoute';

import ApiKeyListRoute from './api/routes/ApiKeyListRoute';
import CMATokensRoute from './api/routes/CMATokensRoute';
import KeyEditorRoute from './api/routes/KeyEditorRoute';

import { TagsRoute } from 'features/content-tags';

export {
  WebhookListRoute,
  WebhookNewRoute,
  WebhookEditRoute,
  WebhookCallRoute,
  ExtensionsListRoute,
  ExtensionEditorRoute,
  RoleEditorRoute,
  RolesListRoute,
  KeyEditorRoute,
  CMATokensRoute,
  ApiKeyListRoute,
  TagsRoute,
};
