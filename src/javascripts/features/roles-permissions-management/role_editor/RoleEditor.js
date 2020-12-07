import { Note, Notification, TabPanel, Tabs } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as PolicyBuilder from 'access_control/PolicyBuilder';
import FeedbackButton from 'app/common/FeedbackButton';
import * as EntityFieldValueHelpers from 'classes/EntityFieldValueHelpers';
import DocumentTitle from 'components/shared/DocumentTitle';
import { Route, RouteTab } from 'core/routing';
import { RouteProvider } from 'core/routing/RouteProvider';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { css } from 'emotion';
import { MetadataTags } from 'features/content-tags';
import { RoleEditorDetails } from 'features/roles-permissions-management/role_editor/RoleEditorDetails';
import { RoleEditorEntities } from 'features/roles-permissions-management/role_editor/RoleEditorEntities';
import { RoleEditorPermissions } from 'features/roles-permissions-management/role_editor/RoleEditorPermissions';
import {
  cloneDeep,
  extend,
  find,
  flow,
  get,
  includes,
  isObject,
  isString,
  omit,
  startsWith,
} from 'lodash';
import { findIndex, map, remove, set, update } from 'lodash/fp';
import PropTypes from 'prop-types';
import React from 'react';
import TheLocaleStore from 'services/localeStore';
import * as logger from 'services/logger';
import * as Navigator from 'states/Navigator';
import { RoleEditRoutes } from 'states/settingsRolesPermissions';

import * as RoleListHandler from '../components/RoleListHandler';
import { createRoleRemover } from '../components/RoleRemover';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import { getLocales } from '../utils/getLocales';
import { RoleEditorActions } from './RoleEditorActions';
import { equalArrays } from '../utils/equalArrays';

const styles = {
  tabs: css({
    overflowX: 'auto',
    display: 'flex',
    paddingLeft: tokens.spacing2Xl,
  }),
  tabPanel: css({
    padding: tokens.spacing2Xl,
  }),
  actionsWrapper: css({
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
  }),
  feedback: css({
    flexGrow: '',
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    marginRight: tokens.spacingXl,
    marginLeft: tokens.spacingXl,
    minWidth: '120px',
  }),
};

const PermissionPropType = PropTypes.shape({
  manage: PropTypes.bool,
  read: PropTypes.bool,
});

const autofixPolicies = (internal, contentTypes) => {
  const locales = getLocales(TheLocaleStore.getPrivateLocales());
  const internalCopy = cloneDeep(internal);
  const autofixed = PolicyBuilder.removeOutdatedRules(internalCopy, contentTypes, locales);
  if (autofixed) {
    return internalCopy;
  }
  return null;
};

export function handleSaveError(response) {
  const errors = get(response, 'body.details.errors', []);

  if (includes(['403', '404'], get(response, 'statusCode'))) {
    Notification.error('You have exceeded your plan limits for Custom Roles.');
    return Promise.reject();
  }

  if (isObject(find(errors, { name: 'taken', path: 'name' }))) {
    Notification.error('This role name is already used.');
    return Promise.reject();
  }

  const nameError = find(errors, { name: 'length', path: 'name' });

  if (nameError) {
    const nameValue = isObject(nameError) ? nameError.value : null;
    if (!nameValue) {
      Notification.error('You have to provide a role name.');
    } else if (isString(nameValue) && nameValue.length > 0) {
      Notification.error('The provided role name is too long.');
    }
    return Promise.reject();
  }

  if (includes(['422'], get(response, 'statusCode')) && errors.length > 0) {
    Notification.error(errors[0].name);
    return Promise.reject();
  }

  Notification.error('Error saving role. Please try again.');
  logger.logServerWarn('Error saving role', { errors });

  return Promise.reject();
}

export class RoleEditor extends React.Component {
  static propTypes = {
    role: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      permissions: PropTypes.objectOf(PermissionPropType),
      policies: PropTypes.array,
      sys: PropTypes.shape(),
    }).isRequired,
    entities: PropTypes.object.isRequired,
    baseRole: PropTypes.shape(),
    autofixed: PropTypes.bool,
    contentTypes: PropTypes.array.isRequired,
    isNew: PropTypes.bool.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    roleRepo: PropTypes.object.isRequired,
    canModifyRoles: PropTypes.bool.isRequired,
    openEntitySelectorForEntity: PropTypes.func.isRequired,
    hasCustomRolesFeature: PropTypes.bool.isRequired,
    hasContentTagsFeature: PropTypes.bool.isRequired,
    hasEnvironmentAliasesEnabled: PropTypes.bool.isRequired,
    ngStateUrl: PropTypes.string.isRequired,
    tab: PropTypes.string.isRequired,
    hasClpFeature: PropTypes.bool.isRequired,
  };

  static contextType = SpaceEnvContext;

  constructor(props) {
    super(props);

    const { role, baseRole } = props;

    const isDuplicate = !!baseRole;

    let internal = PolicyBuilder.toInternal(
      isDuplicate
        ? extend({ name: `Duplicate of ${baseRole.name}` }, omit(baseRole, ['name', 'sys']))
        : role
    );

    if (props.hasCustomRolesFeature && props.canModifyRoles) {
      const autofixedInternals = autofixPolicies(internal, props.contentTypes);
      if (autofixedInternals) {
        internal = autofixedInternals;
      }
    }

    this.state = {
      entityCache: {
        Entry: {},
        Asset: {},
      },
      saving: false,
      dirty: isDuplicate,
      newRules: {
        entries: [],
        assets: [],
      },
      editedRules: {
        entries: {},
        assets: {},
      },
      internal,
      tab: this.props.tab || RoleEditRoutes.Details.url,
    };
  }

  componentDidMount() {
    this.props.setDirty(this.state.dirty);
    this.props.registerSaveAction(this.save);
  }

  setDirty = (dirty) => {
    this.setState({ dirty });
    this.props.setDirty(dirty);
  };

  searchEntities = (entityType) => {
    const { entityCache } = this.state;
    return this.props.openEntitySelectorForEntity(entityType).then((entities) => {
      if (entities && entities.length === 1) {
        const entity = entities[0];
        entityCache[entityType][entity.sys.id] = entity;
        this.setState({ entityCache });
        return entity;
      }
    });
  };

  getEntityTitle = (entityId, contentTypeId) => {
    const { contentTypes, entities } = this.props;
    const { entityCache } = this.state;
    const entityType = contentTypeId ? 'Entry' : 'Asset';

    // entities have different formats if they are fetched via the app/entity_editor/DataLoader or the entitySelector
    // TODO: We're actually not using DataLoader anymore. Simplify expected data structure.
    const data = entities[entityType][entityId]
      ? entities[entityType][entityId].entity.data
      : entityCache[entityType][entityId];

    if (!data) return entityId;
    const { internal_code: defaultLocale } = TheLocaleStore.getDefaultLocale();

    try {
      if (entityType === 'Entry') {
        return EntityFieldValueHelpers.getEntryTitle({
          entry: data,
          contentType: contentTypes.find((type) => type.sys.id === contentTypeId),
          internalLocaleCode: defaultLocale,
          defaultInternalLocaleCode: defaultLocale,
          defaultTitle: 'Untitled',
        });
      } else {
        return EntityFieldValueHelpers.getAssetTitle({
          asset: data,
          internalLocaleCode: defaultLocale,
          defaultInternalLocaleCode: defaultLocale,
          defaultTitle: 'Untitled',
        });
      }
    } catch (err) {
      logger.logServerWarn(`Could not find title for ${entityId}`);
      return entityId;
    }
  };

  delete = () => {
    const { role } = this.props;
    const { currentSpace, currentSpaceId, currentEnvironmentId } = this.context;

    const listHandler = RoleListHandler.create(currentSpaceId, currentEnvironmentId);
    listHandler.reset().then(() => {
      createRoleRemover(listHandler, role, currentSpace).then((removed) => {
        if (removed) {
          this.setDirty(false);
          Navigator.go({
            path: 'spaces.detail.settings.roles.list',
          });
        }
      });
    });
  };

  duplicate = () => {
    const { role } = this.props;

    if (get(role, 'sys.id')) {
      Navigator.go({
        path: '^.new',
        params: { baseRoleId: role.sys.id, tab: this.state.tab },
      });
    }
  };

  save = (autofix = false) => {
    this.setState({ saving: true });
    const { isNew, baseRole } = this.props;
    const { internal } = this.state;
    const external = PolicyBuilder.toExternal(internal);

    if (!get(external, 'policies', null)) {
      Notification.error('Policies: invalid JSON.');
    }

    const isDuplicate = !!baseRole;
    const method = isNew || isDuplicate ? 'create' : 'save';
    return this.props.roleRepo[method](external)
      .then(this.handleSaveSuccess(autofix), handleSaveError)
      .finally(() => this.setState({ saving: false }));
  };

  handleSaveSuccess = (autofix) => (role) => {
    const { isNew } = this.props;
    if (autofix) {
      Notification.success('One or more rules referencing deleted data where removed');
    } else {
      Notification.success(`${role.name} role saved successfully`);
    }

    if (isNew) {
      this.setDirty(false);
      return Navigator.go({ path: '^.detail', params: { roleId: role.sys.id } });
    } else {
      const newInternal = PolicyBuilder.toInternal(role);
      this.setState({ internal: newInternal });
      this.setDirty(false);
      return Promise.resolve(role);
    }
  };

  updateInternal = (updater) => {
    const newInternal = updater(this.state.internal);
    this.setState(
      {
        internal: newInternal,
        external: PolicyBuilder.toExternal(newInternal),
      },
      () => {
        this.setDirty(true);
      }
    );
  };

  resetPolicies = () =>
    this.updateInternal((internal) =>
      extend(internal, {
        entries: { allowed: [], denied: [] },
        assets: { allowed: [], denied: [] },
        uiCompatible: true,
      })
    );

  updateRuleAttribute = (entities) => (rulesKey, id) => (attribute) => ({ target: { value } }) => {
    const DEFAULT_FIELD = PolicyBuilder.PolicyBuilderConfig.NO_PATH_CONSTRAINT;
    const DEFAULT_LOCALE = PolicyBuilder.PolicyBuilderConfig.ALL_LOCALES;

    const rules = this.state.internal[entities][rulesKey];
    const index = findIndex({ id }, rules);
    const rule = rules[index];
    let updatedRule = { ...rule, [attribute]: value };

    switch (attribute) {
      case 'action': {
        switch (value) {
          case 'update':
            updatedRule = { ...updatedRule, field: DEFAULT_FIELD, locale: DEFAULT_LOCALE };
            break;
          case 'create':
            updatedRule = { ...updatedRule, scope: 'any', field: null, locale: null };
            break;
          default:
            updatedRule = { ...updatedRule, field: null, locale: null };
        }
        break;
      }
      case 'contentType':
        updatedRule = {
          ...updatedRule,
          field: updatedRule.action === 'update' ? DEFAULT_FIELD : null,
        };
        break;
    }

    this.updateInternal(set([entities, rulesKey, index], updatedRule));
  };

  addRule = (entity, entities) => (rulesKey) => () => {
    const getDefaultRule = PolicyBuilder.DefaultRule.getDefaultRuleGetterFor(entity);
    const defaultRule = getDefaultRule();
    this.updateInternal(update([entities, rulesKey], (rules = []) => [...rules, defaultRule]));
    return defaultRule.id;
  };

  removeRule = (entities) => (rulesKey, id) => () => {
    this.updateInternal(update([entities, rulesKey], remove({ id })));
  };

  updateRoleFromTextInput = (property) => ({ target: { value } }) => {
    this.updateInternal(set([property].join('.'), value));
  };

  updateRoleFromCheckbox = (property) => ({ target: { checked } }) => {
    let update = set(property, checked);
    if (property === 'contentDelivery.manage' && checked === true) {
      update = flow(update, set('contentDelivery.read', true));
    }

    if (property === 'environments.manage' && checked === false) {
      update = flow(update, set('environmentAliases.manage', false));
    }

    this.updateInternal(update);
  };

  updateLocale = ({ target: { value: newLocale } }) => {
    const mapPolicies = map((policy) =>
      policy.action === 'update' ? set('locale', newLocale, policy) : policy
    );
    this.updateInternal(
      flow(update('entries.allowed', mapPolicies), update('assets.allowed', mapPolicies))
    );
  };

  addNewRule = (entity) => {
    return (ruleId) => {
      this.setState(({ newRules }) => {
        newRules[entity] = [...newRules[entity], ruleId];
        return newRules;
      });
    };
  };

  removeNewRule = (entity) => {
    return (ruleId) => {
      this.setState(({ newRules }) => {
        newRules[entity] = newRules[entity].filter((id) => id !== ruleId);
        return newRules;
      });
    };
  };

  addEditedRule = (entity) => {
    return (editRuleId, field, initialValue, newValue) => {
      this.setState(({ editedRules }) => {
        if (!editedRules[entity][editRuleId]) {
          editedRules[entity][editRuleId] = {};
        }

        if (!editedRules[entity][editRuleId][field]) {
          editedRules[entity][editRuleId][field] = {
            initialValue,
          };
        }

        if (
          field === 'scope' &&
          newValue !== 'entityId' &&
          !editedRules[entity][editRuleId].entityId?.initialValue
        ) {
          delete editedRules[entity][editRuleId].entityId;
        }

        if (
          (field !== 'metadataTagIds' &&
            editedRules[entity][editRuleId][field].initialValue !== newValue) ||
          (field === 'metadataTagIds' &&
            !equalArrays(editedRules[entity][editRuleId][field].initialValue, newValue))
        ) {
          editedRules[entity][editRuleId][field].newValue = newValue;
          return editedRules;
        }

        delete editedRules[entity][editRuleId][field];

        if (!Object.keys(editedRules[entity][editRuleId]).length) {
          delete editedRules[entity][editRuleId];
        }

        return editedRules;
      });
    };
  };

  navigateToList() {
    return Navigator.go({ path: '^.list' });
  }

  navigateToTab = (tab) => {
    this.setState({ tab });
    return Navigator.go({
      path: '.',
      params: { tab },
      options: {
        notify: false,
      },
    });
  };

  render() {
    const {
      role,
      autofixed,
      canModifyRoles,
      hasCustomRolesFeature,
      hasContentTagsFeature,
      hasEnvironmentAliasesEnabled,
    } = this.props;

    const { saving, internal, isLegacy, dirty } = this.state;

    const showTranslator = startsWith(role.name, 'Translator');

    let title = '';
    if (dirty) {
      title = `${internal.name || 'Untitled'}*`;
    } else {
      title = internal.name || 'Untitled';
    }

    return (
      <RouteProvider ngStateUrl={this.state.tab}>
        <MetadataTags>
          <DocumentTitle title={`${title} | Roles`} />
          <RolesWorkbenchSkeleton
            type={'full'}
            title={title}
            onBack={() => {
              this.navigateToList();
            }}
            actions={
              <div className={styles.actionsWrapper}>
                <div className={styles.feedback}>
                  <FeedbackButton
                    className={styles.feedback}
                    about="Roles & Permissions"
                    target="devWorkflows"
                    label={'Give feedback'}
                  />
                </div>
                <RoleEditorActions
                  hasCustomRolesFeature={hasCustomRolesFeature}
                  canModifyRoles={canModifyRoles}
                  showTranslator={showTranslator}
                  dirty={dirty}
                  saving={saving}
                  isLegacy={isLegacy}
                  internal={internal}
                  onSave={this.save}
                  onDuplicate={this.duplicate}
                  onDelete={this.delete}
                />
              </div>
            }>
            <Tabs withDivider className={styles.tabs}>
              <RouteTab onSelect={this.navigateToTab} {...RoleEditRoutes.Details} />
              <RouteTab onSelect={this.navigateToTab} {...RoleEditRoutes.Content} />
              <RouteTab onSelect={this.navigateToTab} {...RoleEditRoutes.Media} />
              <RouteTab onSelect={this.navigateToTab} {...RoleEditRoutes.Permissions} />
            </Tabs>

            {autofixed && (
              <Note noteType="warning" className={css({ marginBottom: tokens.spacingL })}>
                Some rules have been removed because of changes in your content structure. Please
                review your rules and click &quot;Save changes&quot;.
              </Note>
            )}

            <TabPanel id={`role-tab-panel`} className={styles.tabPanel}>
              <Route path={RoleEditRoutes.Details.url}>
                <RoleEditorDetails
                  updateRoleFromTextInput={this.updateRoleFromTextInput}
                  updateLocale={this.updateLocale}
                  canModifyRoles={canModifyRoles}
                  showTranslator={showTranslator}
                  hasCustomRolesFeature={hasCustomRolesFeature}
                  internal={internal}
                />
              </Route>
              <Route path={RoleEditRoutes.Content.url}>
                <RoleEditorEntities
                  title={'Content'}
                  entity={'entry'}
                  entities={'entries'}
                  rules={internal.entries}
                  internal={internal}
                  canModifyRoles={canModifyRoles}
                  addRule={this.addRule}
                  removeRule={this.removeRule}
                  updateRuleAttribute={this.updateRuleAttribute}
                  updateRoleFromTextInput={this.updateRoleFromTextInput}
                  contentTypes={this.props.contentTypes}
                  searchEntities={this.searchEntities}
                  getEntityTitle={this.getEntityTitle}
                  resetPolicies={this.resetPolicies}
                  hasClpFeature={this.props.hasClpFeature && this.props.hasContentTagsFeature}
                  newRuleIds={this.state.newRules.entries}
                  addNewRule={this.addNewRule('entries')}
                  removeNewRule={this.removeNewRule('entries')}
                  editedRuleIds={Object.keys(this.state.editedRules.entries)}
                  addEditedRule={this.addEditedRule('entries')}
                />
              </Route>

              <Route path={RoleEditRoutes.Media.url}>
                <RoleEditorEntities
                  title={'Media'}
                  entity={'asset'}
                  entities={'assets'}
                  rules={internal.assets}
                  internal={internal}
                  canModifyRoles={canModifyRoles}
                  addRule={this.addRule}
                  removeRule={this.removeRule}
                  updateRuleAttribute={this.updateRuleAttribute}
                  updateRoleFromTextInput={this.updateRoleFromTextInput}
                  contentTypes={this.props.contentTypes}
                  searchEntities={this.searchEntities}
                  getEntityTitle={this.getEntityTitle}
                  resetPolicies={this.resetPolicies}
                  hasClpFeature={this.props.hasClpFeature && this.props.hasContentTagsFeature}
                  newRuleIds={this.state.newRules.assets}
                  addNewRule={this.addNewRule('assets')}
                  removeNewRule={this.removeNewRule('assets')}
                  editedRuleIds={Object.keys(this.state.editedRules.assets)}
                  addEditedRule={this.addEditedRule('assets')}
                />
              </Route>
              <Route path={RoleEditRoutes.Permissions.url}>
                <RoleEditorPermissions
                  internal={internal}
                  canModifyRoles={canModifyRoles}
                  updateRoleFromCheckbox={this.updateRoleFromCheckbox}
                  hasContentTagsFeature={hasContentTagsFeature}
                  hasEnvironmentAliasesEnabled={hasEnvironmentAliasesEnabled}
                />
              </Route>
            </TabPanel>
          </RolesWorkbenchSkeleton>
        </MetadataTags>
      </RouteProvider>
    );
  }
}
