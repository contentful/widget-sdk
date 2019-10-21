import { omitBy } from 'lodash';
import { addUserOrgSpace } from './Decorators.es6';
import { getSchema } from 'analytics/snowplow/Schemas.es6';

export default function(action) {
  return (_, data) => {
    const experiment = addUserOrgSpace((_, data) => {
      return {
        schema: getSchema('experiment').path,
        data: omitBy(
          {
            experiment_id: data.experiment.id,
            variation: data.experiment.variation,
            interaction_context: data.experiment.interaction_context,
            action
          },
          (
            _,
            key // exclude interaction_context for any actions except 'interaction'
          ) => key === 'interaction_context' && action !== 'interaction'
        )
      };
    })(_, data);

    return {
      data: {},
      contexts: [experiment]
    };
  };
}
