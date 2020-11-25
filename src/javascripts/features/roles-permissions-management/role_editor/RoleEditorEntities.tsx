import * as React from 'react';
import { RuleList } from './RuleList';
import TheLocaleStore from 'services/localeStore';
import { Internal } from './RoleTypes';
import {
  Heading,
  Note,
  Paragraph,
  Textarea,
  TextLink,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { RuleInterface } from 'features/roles-permissions-management/@types';

type Props = {
  entity: string;
  entities: string;
  internal: Internal;
  rules: {
    allowed: RuleInterface[];
    denied: RuleInterface[];
  };
  updateRuleAttribute: (
    entities: string
  ) => (
    rulesKey: string,
    id: string
  ) => (attribute: string) => (event: React.ChangeEvent<{ value: string }>) => void;
  addRule: (entity: string, entities: string) => (rulesKey) => () => string;
  removeRule: (entities: string) => (rulesKey: string, id: string) => () => void;
  canModifyRoles: boolean;
  contentTypes: string[];
  searchEntities: () => void;
  getEntityTitle: () => string;
  resetPolicies: () => void;
  updateRoleFromTextInput: (path: string) => (...args) => void;
  hasClpFeature: boolean;
  filters: {
    action: string;
  };
  updateFilter: (filterName: string, value: string) => void;
  draftRulesIds: string[];
  addDraftRuleId: (ruleId: string) => void;
  removeDraftRuleId: (ruleId: string) => void;
  editedRuleIds: string[];
  addEditedRule: (ruleId: string, field: string, initialValue: string, newValue: string) => void;
};

const styles = {
  note: css({
    width: tokens.contentWidthText,
    marginBottom: tokens.spacingXl,
  }),
  nodeHeading: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

const RoleEditorEntities: React.FC<Props> = ({
  entity,
  entities,
  rules,
  internal,
  canModifyRoles,
  updateRuleAttribute,
  addRule,
  removeRule,
  contentTypes,
  searchEntities,
  getEntityTitle,
  updateRoleFromTextInput,
  resetPolicies,
  hasClpFeature,
  draftRulesIds,
  addDraftRuleId,
  removeDraftRuleId,
  editedRuleIds,
  addEditedRule,
}) => {
  return (
    <>
      <Note className={styles.note}>
        <span className={styles.nodeHeading}>
          Anything that is not explicitly allowed, is denied.
        </span>
        <div>
          Learn more about how to set up a{' '}
          <ExternalTextLink href="https://www.contentful.com/developers/docs/concepts/roles-permissions/">
            custom role.
          </ExternalTextLink>
        </div>
      </Note>
      {internal.uiCompatible ? (
        <RuleList
          rules={rules}
          onUpdateRuleAttribute={updateRuleAttribute(entities)}
          onAddRule={addRule(entity, entities)}
          onRemoveRule={removeRule(entities)}
          entity={entity}
          isDisabled={!canModifyRoles}
          privateLocales={TheLocaleStore.getPrivateLocales()}
          contentTypes={contentTypes}
          searchEntities={searchEntities}
          getEntityTitle={getEntityTitle}
          hasClpFeature={hasClpFeature}
          draftRulesIds={draftRulesIds}
          addDraftRuleId={addDraftRuleId}
          removeDraftRuleId={removeDraftRuleId}
          editedRuleIds={editedRuleIds}
          addEditedRule={addEditedRule}
        />
      ) : (
        <>
          <Heading element="h3">Policies</Heading>
          <Paragraph>
            <span>The policy for this role cannot be represented visually.</span>
            {canModifyRoles && (
              <span>
                You can continue to edit the JSON directly, or{' '}
                <TextLink href="" onClick={resetPolicies}>
                  clear the policy
                </TextLink>{' '}
                to define policy rules visually.
              </span>
            )}
          </Paragraph>
          <div className="cfnext-form-option">
            <Textarea
              className="cfnext-form__input--full-size"
              disabled={!canModifyRoles}
              value={internal.policyString || ''}
              onChange={updateRoleFromTextInput('policyString')}
              rows={10}
            />
          </div>
        </>
      )}
    </>
  );
};

export { RoleEditorEntities };
