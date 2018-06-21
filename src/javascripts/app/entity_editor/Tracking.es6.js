import { track } from 'analytics/Analytics';
import { stateName } from 'data/CMA/EntityState';
import * as K from 'utils/kefir';
import spaceContext from 'spaceContext';

export default function install (entityInfo, document, lifeline$) {
  K.onValueWhile(lifeline$, document.resourceState.stateChange$, data => {
    track('entry_editor:state_changed', {
      fromState: stateName(data.from),
      toState: stateName(data.to),
      entityType: entityInfo.type,
      entityId: entityInfo.id
    });
  });
}

export async function trackEntryView ({
  editorData,
  entityInfo,
  editorType,
  currentSlideLevel,
  locale
}) {
  const refCts = await getReferencesContentTypes(editorData, locale);

  track('entry_editor:view', {
    entryId: entityInfo.id,
    ctId: entityInfo.contentTypeId,
    ctName: entityInfo.contentType.name,
    referencesCTMetadata: [
      ...refCts.map(ct => ({
        id: ct.data.sys.id,
        name: ct.data.name
      }))
    ],
    currentSlideLevel,
    editorType
  });
}

async function getReferencesContentTypes (editorData, locale) {
  const referenceFieldsIds = editorData.fieldControls.form
    .filter(({ field }) => field.type === 'Link' && field.linkType === 'Entry')
    .map(ctrl => ctrl.field.id);
  const refEntitiesIds = referenceFieldsIds
    .filter(id => editorData.entity.data.fields[id] !== undefined)
    .map(id => editorData.entity.data.fields[id][locale].sys.id);
  const refEntities = await Promise.all(
    refEntitiesIds.map(id => spaceContext.space.getEntry(id))
  );
  const refCts = refEntities.map(entity =>
    spaceContext.publishedCTs.get(entity.data.sys.contentType.sys.id)
  );

  return refCts;
}
