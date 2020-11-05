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

type Props = {
  entity: string;
  entities: string;
  internal: Internal;
  rules: unknown[];
  updateRuleAttribute: (entities: string) => void;
  addRule: (entity: string, entities: string) => void;
  removeRule: (entities: string) => void;
  canModifyRoles: boolean;
  contentTypes: string[];
  searchEntities: string[];
  getEntityTitle: () => string;
  resetPolicies: () => void;
  updateRoleFromTextInput: (path: string) => (...args) => void;
};

const styles = {
  note: css({
    marginBottom: tokens.spacingXl,
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
}) => {
  return (
    <>
      <Note className={styles.note}>Anything that is not explicitly allowed, is denied.</Note>
      {internal.uiCompatible && !internal.metadataTagRuleExists ? (
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
