import { registerFactory } from 'NgRegistry';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';

import * as Analytics from 'analytics/Analytics';

import { appendDuplicateIndexToEntryTitle } from '../app/entity_editor/entityHelpers';

export default function register() {
  registerFactory('batchPerformer', [
    '$q',
    'spaceContext',
    ($q, spaceContext) => {
      const ACTION_NAMES = {
        publish: 'published',
        unpublish: 'unpublished',
        archive: 'archived',
        unarchive: 'unarchived',
        delete: 'deleted',
        duplicate: 'duplicated'
      };

      const ENTITY_PLURAL_NAMES = {
        Entry: 'Entries',
        Asset: 'Assets'
      };

      return { create: createBatchPerformer };

      function createBatchPerformer(config) {
        return _.transform(
          _.keys(ACTION_NAMES),
          (acc, action) => {
            acc[action] = _.partial(run, action);
          },
          {}
        );

        function run(method) {
          const actions = _.map(config.getSelected(), entity => performAction(entity, method));

          return $q.all(actions).then(function handleResults(results) {
            results = groupBySuccess(results);
            notifyBatchResult(method, results);
            if (_.isFunction(config.onComplete)) {
              config.onComplete();
            }
            Analytics.track('search:bulk_action_performed', {
              entityType: config.entityType,
              action: method
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
          return { entity: entity };
        }

        function handleEntityError(entity, err) {
          if (err && err.statusCode === 404) {
            entity.setDeleted();
            config.onDelete(entity);
            return handleSuccess(entity);
          } else {
            return { err: err };
          }
        }

        function call(entity, method) {
          if (method === 'duplicate') {
            return callDuplicate(entity);
          } else if (method === 'delete') {
            return callDelete(entity);
          } else {
            return entity[method]();
          }
        }

        function callDuplicate(entity) {
          const sys = entity.getSys();
          if (sys.type === 'Entry') {
            const ctId = _.get(sys, 'contentType.sys.id');
            const contentType = spaceContext.publishedCTs.get(ctId);
            const entryTitleId = _.get(contentType, 'data.displayField');
            const data = _.omit(entity.data, 'sys');
            return spaceContext.space.createEntry(ctId, {
              fields: appendDuplicateIndexToEntryTitle(data.fields, entryTitleId)
            });
          } else {
            return $q.reject(new Error('Only entries can be duplicated'));
          }
        }

        function callDelete(entity) {
          return entity.delete().then(() => {
            config.onDelete(entity);
            return entity;
          });
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
          const entityName = ENTITY_PLURAL_NAMES[config.entityType];

          if (results.succeeded.length > 0) {
            Notification.success(
              results.succeeded.length + ' ' + entityName + ' ' + actionName + ' successfully'
            );
          }
          if (results.failed.length > 0) {
            Notification.error(
              results.failed.length + ' ' + entityName + ' could not be ' + actionName
            );
          }
        }
      }
    }
  ]);
}