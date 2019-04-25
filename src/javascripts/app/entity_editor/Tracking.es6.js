import { get, flatten, uniqBy } from 'lodash';
import { track } from 'analytics/Analytics.es6';
import { stateName } from 'data/CMA/EntityState.es6';
import * as K from 'utils/kefir.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient/index.es6';

export default function install(entityInfo, document, lifeline$) {
  K.onValueWhile(lifeline$, document.resourceState.stateChange$, data => {
    track('entry_editor:state_changed', {
      fromState: stateName(data.from),
      toState: stateName(data.to),
      entityType: entityInfo.type,
      entityId: entityInfo.id
    });
  });
}

export async function trackEntryView({
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
      ...uniqBy(
        refCts.map(ct => ({
          id: ct.data.sys.id,
          name: ct.data.name
        })),
        'id'
      )
    ],
    currentSlideLevel,
    editorType,
    editorData
  });
}

const isEntryReferenceField = ({ field }) =>
  field.type === 'Array' && field.items.type === 'Link' && field.items.linkType === 'Entry';

const getFieldId = ctrl => ctrl.field.id;
const getReferenceEntitiesIds = (id, locale, editorData) => {
  const localeField = editorData.entity.data.fields[id][locale];
  // A field value might not be provided in all expected locales.
  return localeField ? localeField.map(entity => entity.sys.id) : [];
};

async function getReferencesContentTypes(editorData, locale) {
  const batchingApiClient = getBatchingApiClient(spaceContext.cma);
  const referenceFieldsIds = editorData.fieldControls.form
    .filter(isEntryReferenceField)
    .map(getFieldId);
  const refEntitiesIds = referenceFieldsIds
    .filter(id => editorData.entity.data.fields[id] !== undefined)
    .map(id => getReferenceEntitiesIds(id, locale, editorData));
  const refEntities = await Promise.all(
    flatten(refEntitiesIds).map(id => batchingApiClient.getEntry(id))
  );
  const refCts = refEntities.map(entity =>
    spaceContext.publishedCTs.get(get(entity, 'sys.contentType.sys.id'))
  );

  return refCts;
}
