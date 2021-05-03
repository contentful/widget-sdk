import { get, flatten, uniqBy } from 'lodash';
import { track } from 'analytics/Analytics';
import * as K from 'core/utils/kefir';

export default function install(entityInfo, document, lifeline$) {
  K.onValueWhile(lifeline$, document.resourceState.stateChange$, (data) => {
    track('entry_editor:state_changed', {
      fromState: data.from,
      toState: data.to,
      entityType: entityInfo.type,
      entityId: entityInfo.id,
    });
  });
}

export async function trackEntryView({
  editorData,
  entityInfo,
  editorType,
  currentSlideLevel,
  locale,
  cma,
  publishedCTs,
}) {
  const refCts = await getReferencesContentTypes(editorData, locale, cma, publishedCTs);

  track('entry_editor:view', {
    entryId: entityInfo.id,
    ctId: entityInfo.contentTypeId,
    ctName: entityInfo.contentType.name,
    referencesCTMetadata: [
      ...uniqBy(
        refCts.map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        })),
        'id'
      ),
    ],
    currentSlideLevel,
    editorType,
    widgetTrackingContexts: editorData.widgetTrackingContexts,
  });
}

const isEntryReferenceField = ({ field }) =>
  field.type === 'Array' && field.items.type === 'Link' && field.items.linkType === 'Entry';

const getFieldId = (ctrl) => ctrl.field.id;
const getReferenceEntitiesIds = (id, locale, editorData) => {
  const localeField = editorData.entity.data.fields[id][locale];
  // A field value might not be provided in all expected locales.
  return localeField ? localeField.map((entity) => entity.sys.id) : [];
};

async function getReferencesContentTypes(editorData, locale, cma, publishedCTs) {
  const referenceFieldsIds = editorData.fieldControls.form
    .filter(isEntryReferenceField)
    .map(getFieldId);
  const refEntitiesIds = referenceFieldsIds
    .filter((id) => editorData.entity.data.fields[id] !== undefined)
    .map((id) => getReferenceEntitiesIds(id, locale, editorData));
  const refEntities = await Promise.all(
    flatten(refEntitiesIds).map((id) => cma.getEntry(id).catch((_error) => null))
  );
  const refCts = refEntities
    .filter(Boolean)
    .map((entity) =>
      publishedCTs.find((ct) => get(ct, 'sys.id') === get(entity, 'sys.contentType.sys.id'))
    );
  return refCts;
}
