import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';

import * as Analytics from 'analytics/Analytics';

import {
  appendDuplicateIndexToEntryTitle,
  alignSlugWithEntryTitle,
} from 'app/entity_editor/entityHelpers';

const ACTION_NAMES = {
  publish: 'published',
  unpublish: 'unpublished',
  archive: 'archived',
  unarchive: 'unarchived',
  delete: 'deleted',
  duplicate: 'duplicated',
  save: 'saved',
};

const ENTITY_PLURAL_NAMES = {
  Entry: 'Entries',
  Asset: 'Assets',
};

const getEditorData = _.memoize(
  (spaceContext, contentTypeId) => spaceContext.cma.getEditorInterface(contentTypeId),
  (_spaceContext, contentTypeId) => contentTypeId
);

export function createBatchPerformer(config) {
  const entityType = _.upperFirst(config.entityType);
  return _.transform(
    _.keys(ACTION_NAMES),
    (acc, action) => {
      acc[action] = _.partial(run, action);
    },
    {}
  );

  function run(method) {
    const actions = _.map(config.entities, (entity) => performAction(entity, method));

    return Promise.all(actions).then(function handleResults(results) {
      results = groupBySuccess(results);
      notifyBatchResult(method, results);
      Analytics.track('entity_list:bulk_action_performed', {
        entityType,
        action: method,
        succeeded_count: results.succeeded.length,
        failed_count: results.failed.length,
      });
      return results;
    });
  }

  function performAction(entity, method) {
    const request = _.partial(call, entity, method);
    const handleError = _.partial(handleEntityError, entity);

    return request().then(handleSuccess, handleError);
  }

  function handleSuccess(entity) {
    return { entity };
  }

  async function handleEntityError(entity, err) {
    if (err && err.statusCode === 404) {
      await entity.setDeleted();
      return handleSuccess(entity);
    } else {
      return { err };
    }
  }

  function call(entity, method) {
    if (method === 'duplicate') {
      return callDuplicate(entity);
    }

    return entity[method]();
  }

  async function callDuplicate(entity) {
    const sys = entity.getSys();

    if (sys.type === 'Entry') {
      const spaceContext = getModule('spaceContext');
      const ctId = _.get(sys, 'contentType.sys.id');
      const contentType = spaceContext.publishedCTs.get(ctId);
      const editorData = await getEditorData(spaceContext, ctId);
      const entryTitleId = _.get(contentType, 'data.displayField');
      const entryTitleField =
        contentType.data.fields.find((field) => field.id === entryTitleId) || {};
      const currentFieldsWithIndexedDisplayField = appendDuplicateIndexToEntryTitle(
        entity.data.fields,
        entryTitleId
      );

      const slugControl =
        editorData.controls &&
        editorData.controls.find((control) => control.widgetId === 'slugEditor');
      // [PUL-809] We update the slug with the same index that was set on the displayField
      if (slugControl) {
        const slugField = contentType.data.fields.find((field) =>
          [field.apiName, field.id].includes(slugControl.fieldId)
        );
        if (slugField) {
          const slugFieldData = currentFieldsWithIndexedDisplayField[slugField.id];
          const indexedSlugFieldData = alignSlugWithEntryTitle({
            entryTitleData: currentFieldsWithIndexedDisplayField[entryTitleId],
            unindexedTitleData: entity.data.fields[entryTitleId],
            slugFieldData,
            isRequired: slugField.required,
            isEntryTitleLocalized: entryTitleField.localized,
          });

          if (indexedSlugFieldData) {
            currentFieldsWithIndexedDisplayField[slugField.id] = indexedSlugFieldData;
          }
        }
      }
      return spaceContext.space.createEntry(ctId, {
        fields: currentFieldsWithIndexedDisplayField,
        metadata: entity.data.metadata,
      });
    } else {
      return Promise.reject(new Error('Only entries can be duplicated'));
    }
  }

  function groupBySuccess(results) {
    return _.transform(
      results,
      (acc, result) => {
        const key = result.err ? 'failed' : 'succeeded';
        acc[key].push(result[result.err ? 'err' : 'entity']);
      },
      { failed: [], succeeded: [] }
    );
  }

  function notifyBatchResult(method, results) {
    const actionName = ACTION_NAMES[method];
    const entityName = ENTITY_PLURAL_NAMES[entityType];

    if (results.succeeded.length > 0) {
      Notification.success(`${results.succeeded.length} ${entityName} ${actionName} successfully`);
    }
    if (results.failed.length > 0) {
      Notification.error(`${results.failed.length} ${entityName} could not be ${actionName}`);
    }
  }
}
