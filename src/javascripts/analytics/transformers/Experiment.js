import { omitBy } from 'lodash';
import { addUserOrgSpace } from './Decorators';
import { getSnowplowSchema } from 'analytics/SchemasSnowplow';

export default function Experiment(action) {
  return (_, data) => {
    const experiment = addUserOrgSpace((_, data) => {
      return {
        schema: getSnowplowSchema('experiment').path,
        data: omitBy(
          {
            experiment_id: data.experiment.id,
            variation: data.experiment.variation,
            interaction_context: data.experiment.interaction_context,
            action,
          },
          (
            _,
            key // exclude interaction_context for any actions except 'interaction'
          ) => key === 'interaction_context' && action !== 'interaction'
        ),
      };
    })(_, data);

    return {
      data: {},
      contexts: [experiment],
    };
  };
}
