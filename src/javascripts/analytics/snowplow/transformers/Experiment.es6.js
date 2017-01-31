import { addUserOrgSpace } from './Decorators';

export default addUserOrgSpace((_, data) => {
  return {
    data: {
      experiment_id: data.experiment.id,
      variation: data.experiment.variation
    }
  };
});
