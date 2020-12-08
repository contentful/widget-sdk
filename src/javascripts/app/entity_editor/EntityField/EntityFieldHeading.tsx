import * as React from 'react';
import { FieldLockIndicator } from './FieldLockIndicator';
import { Field, Locale } from './types';
import { FieldAccessType, FieldAccess } from './EntityFieldAccess';

function useFieldRequired(props: { field: Field; entityType: 'Entry' | 'Asset'; locale: Locale }) {
  const { field, entityType, locale } = props;

  let isRequired = field.required;
  if ((entityType === 'Entry' && locale.optional) || (entityType === 'Asset' && !locale.default)) {
    isRequired = false;
  }

  return {
    isRequired,
  };
}

export function EntityFieldHeading(props: {
  field: Field;
  locale: Locale;
  entityType: 'Entry' | 'Asset';
  withLocaleName: boolean;
  access: FieldAccessType;
}) {
  const { locale, access, field, entityType, withLocaleName } = props;

  const { isRequired } = useFieldRequired({ locale, field, entityType });

  return (
    <div className="entity-editor__field-heading">
      <label data-test-id="field-locale-label">
        {field.name}
        {isRequired && <span> (required)</span>}
        {withLocaleName && <span> – {locale.name}</span>}
      </label>
      {access && access.type === FieldAccess.DENIED.type && (
        <div className="entity-editor__no-permission-info" data-test-id="field-locale-permissions">
          <FieldLockIndicator
            text="This field is locked"
            tooltipContent="You don’t have a permission to edit this field. To change your permission setting contact your space administrator."
          />
        </div>
      )}
      {access && access.type === FieldAccess.EDITING_DISABLED.type && (
        <div className="entity-editor__no-permission-info" data-test-id="field-locale-disabled">
          <FieldLockIndicator
            tooltipContent="Editing of this field is disabled. To change your content model contact your space administrator."
            text="This field is disabled"
          />
        </div>
      )}
      {access && access.type === FieldAccess.OCCUPIED.type && (
        <div className="entity-editor__no-permission-info" data-test-id="field-locale-occupied">
          <FieldLockIndicator text="This field is being edited by another user" />
        </div>
      )}
    </div>
  );
}
