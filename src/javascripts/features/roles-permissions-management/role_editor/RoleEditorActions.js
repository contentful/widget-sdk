import React from 'react';
import PropTypes from 'prop-types';
import { Button, Paragraph } from '@contentful/forma-36-react-components';
import { RoleEditorButton } from './RoleEditorButton';

export function RoleEditorActions(props) {
  const { dirty, saving, internal, canModifyRoles, showTranslator } = props;

  if (props.hasCustomRolesFeature) {
    return (
      <RoleEditorButton
        onSave={() => props.onSave()}
        onDuplicate={props.onDuplicate}
        onDelete={props.onDelete}
        disabled={!dirty}
        loading={saving}
        showDropdown={internal.id && canModifyRoles}
      />
    );
  }

  return (
    <>
      {showTranslator && (
        <Button
          testId="save-button"
          disabled={!dirty}
          loading={saving}
          onClick={() => props.onSave()}>
          Save changes
        </Button>
      )}
      {!showTranslator && (
        <Paragraph>
          This role can‘t be customized because your plan does not include custom roles.
        </Paragraph>
      )}
    </>
  );
}

RoleEditorActions.propTypes = {
  hasCustomRolesFeature: PropTypes.bool,
  canModifyRoles: PropTypes.bool,
  showTranslator: PropTypes.bool,
  dirty: PropTypes.bool,
  saving: PropTypes.bool,
  internal: PropTypes.any,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onSave: PropTypes.func,
};
