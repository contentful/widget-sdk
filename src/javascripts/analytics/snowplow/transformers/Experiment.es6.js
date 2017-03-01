import { addUserOrgSpace } from './Decorators';
import { getSchema } from 'analytics/snowplow/Schemas';

export default function (action) {
  return (_, data) => {
    const experiment = addUserOrgSpace((_, data) => {
      return {
        schema: getSchema('experiment').path,
        data: {
          experiment_id: data.experiment.id,
          variation: data.experiment.variation,
          action
        }
      };
    })(_, data);

    return {
      data: {},
      contexts: [experiment]
    };
  };
}
