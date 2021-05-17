import * as Analytics from 'analytics/Analytics';
import { get } from 'lodash';

export const trackAddedField = (contentType, field) => {
  Analytics.track('content_modelling:field_added', {
    contentTypeId: contentType.sys.id,
    contentTypeName: contentType.name,
    fieldId: field.id,
    fieldName: field.name,
    fieldType: field.type,
    fieldItemType: get(field, 'items.type') || null,
    fieldLocalized: field.localized,
    fieldRequired: field.required,
  });
};

export const trackEnforcedButtonClick = (err) => {
  // If we get reason(s), that means an enforcement is present
  const reason = get(err, 'body.details.reasons', null);

  Analytics.track('entity_button:click', {
    entityType: 'contentType',
    enforced: Boolean(reason),
    reason,
  });
};
