import * as React from 'react';
import { TextField } from '@contentful/forma-36-react-components';
import { TranslatorRoleSelector } from './TranslatorRoleSelector';
import TheLocaleStore from 'services/localeStore';
import { Internal } from './RoleTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

type Props = {
  internal: Internal;
  updateRoleFromTextInput: (path: string) => (...args) => void;
  updateLocale: ({ target: { value } }) => void;
  canModifyRoles: boolean;
  showTranslator: boolean;
  hasCustomRolesFeature: boolean;
};
const styles = {
  input: css({
    marginBottom: tokens.spacingM,
    width: 420,
  }),
};
const RoleEditorDetails: React.FC<Props> = ({
  internal,
  updateRoleFromTextInput,
  updateLocale,
  canModifyRoles,
  showTranslator,
  hasCustomRolesFeature,
}) => {
  return (
    <>
      <TextField
        required
        name="nameInput"
        id="opt_name"
        labelText="Name"
        className={styles.input}
        value={internal.name || ''}
        onChange={updateRoleFromTextInput('name')}
        textInputProps={{ disabled: !canModifyRoles }}
      />
      <TextField
        textarea
        name="descriptionInput"
        id="opt_description"
        labelText="Description"
        className={styles.input}
        value={internal.description || ''}
        onChange={updateRoleFromTextInput('description')}
        textInputProps={{ disabled: !canModifyRoles }}
      />
      {showTranslator && (
        <TranslatorRoleSelector
          policies={internal}
          hasFeatureEnabled={hasCustomRolesFeature}
          onChange={updateLocale}
          privateLocales={TheLocaleStore.getPrivateLocales()}
        />
      )}
    </>
  );
};

export { RoleEditorDetails };
