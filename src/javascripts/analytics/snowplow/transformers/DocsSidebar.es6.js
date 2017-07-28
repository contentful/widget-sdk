import { omitBy, isNil } from 'lodash';
import { addUserOrgSpace } from './Decorators';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/DocsSidebar
 * @description
 * Exports a function that transforms data for the docs sidebar
 */

export default addUserOrgSpace((_, data) => {
  return omitBy({
    data: {
      action: data.action,
      url: data.url,
      contentCopied: data.contentCopied
    }
  }, isNil);
});
