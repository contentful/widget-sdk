import transformer from './Experiment';

describe('Experiment transformer', () => {
  let data;
  let experimentTransformer;
  let transformedData;

  beforeEach(async function () {
    data = {
      experiment: {
        id: 'experiment',
        variation: true,
        interaction_context: 'test',
      },
      organizationId: 'org',
      spaceId: 'space',
      userId: 'user',
    };
    experimentTransformer = function (action) {
      return transformer(action)(null, data);
    };
    transformedData = transformer('action')(null, data);
  });

  it('should have an empty object for data', function () {
    expect(transformedData.data).toEqual({});
  });

  describe('contexts array', () => {
    it('should have one element', function () {
      expect(Array.isArray(transformedData.contexts)).toBe(true);
      expect(transformedData.contexts).toHaveLength(1);
    });
    it('should contain an experiment object without interaction context', function () {
      const experiment = transformedData.contexts[0];

      expect(typeof experiment.schema).toBe('string');
      expect(experiment.data).toEqual({
        experiment_id: data.experiment.id,
        variation: data.experiment.variation,
        action: 'action',
        executing_user_id: data.userId,
        organization_id: data.organizationId,
        space_id: data.spaceId,
      });
    });
    it('should contain an experiment object with interaction context', function () {
      const experiment = experimentTransformer('interaction').contexts[0];

      expect(typeof experiment.schema).toBe('string');
      expect(experiment.data).toEqual({
        experiment_id: data.experiment.id,
        variation: data.experiment.variation,
        interaction_context: data.experiment.interaction_context,
        action: 'interaction',
        executing_user_id: data.userId,
        organization_id: data.organizationId,
        space_id: data.spaceId,
      });
    });
  });
});
