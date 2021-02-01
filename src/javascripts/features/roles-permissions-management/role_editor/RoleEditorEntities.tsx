import * as React from 'react';
import { RuleList } from './RuleList';
import TheLocaleStore from 'services/localeStore';
import { Internal } from './RoleTypes';
import {
  DisplayText,
  Heading,
  Paragraph,
  Textarea,
  TextLink,
  Typography,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { IncompleteRulesList, RuleInterface } from 'features/roles-permissions-management/@types';

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
  newRuleIds: string[];
  addNewRule: (ruleId: string) => void;
  removeNewRule: (ruleId: string) => void;
  editedRuleIds: string[];
  addEditedRule: (ruleId: string, field: string, initialValue: string, newValue: string) => void;
  incompleteRulesList: IncompleteRulesList;
};

const styles = {
  title: css({
    marginBottom: tokens.spacing2Xl,
  }),
  heading: css({
    marginBottom: tokens.spacingXs,
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
  newRuleIds,
  addNewRule,
  removeNewRule,
  editedRuleIds,
  addEditedRule,
  incompleteRulesList,
}) => {
  return (
    <>
      <Typography className={styles.title}>
        <DisplayText className={styles.heading}>
          {entity === 'asset' ? 'Media' : 'Content'}
        </DisplayText>
        <Paragraph>
          Add allow and deny rules to define this role&apos;s access to{' '}
          {entity === 'asset' ? 'media' : 'content'}
          <br />
          Anything that&apos;s not explicitly allowed is denied.{' '}
          <ExternalTextLink href="https://www.contentful.com/developers/docs/concepts/roles-permissions/">
            Learn more
          </ExternalTextLink>
        </Paragraph>
      </Typography>
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
          newRuleIds={newRuleIds}
          addNewRule={addNewRule}
          removeNewRule={removeNewRule}
          editedRuleIds={editedRuleIds}
          addEditedRule={addEditedRule}
          incompleteRulesList={incompleteRulesList}
        />
      ) : (
        <>
          <Heading element="h3">Policies</Heading>
          <Paragraph>
            <span>The policy for this role cannot be represented visually. </span>
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
