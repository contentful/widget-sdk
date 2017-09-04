import { omitBy, isNil } from 'lodash';
import { addUserOrgSpace } from './Decorators';
import $state from '$state';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/ContextualHelp
 * @description
 * Exports a function that transforms data for the docs sidebar
 */

export default addUserOrgSpace((_, data) => {
  return {
    data: omitBy({
      action: data.action,
      is_intro: data.isIntro,
      url: data.url,
      content_copied_id: data.contentCopiedId,
      current_state: $state.current.name
    }, isNil)
  };
});
