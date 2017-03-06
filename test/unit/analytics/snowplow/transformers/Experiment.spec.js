describe('Experiment transformer', function () {
  beforeEach(function () {
    module('contentful/test');

    const experimentTransformer = this.$inject('analytics/snowplow/transformers/Experiment').default;

    this.data = {
      experiment: {
        id: 'experiment',
        variation: true
      },
      organizationId: 'org',
      spaceId: 'space',
      userId: 'user'
    };
    this.transformedData = experimentTransformer('action')(null, this.data);
  });

  it('should have an empty object for data', function () {
    expect(this.transformedData.data).toEqual({});
  });

  describe('contexts array', function () {
    it('should have one element', function () {
      expect(Array.isArray(this.transformedData.contexts)).toBe(true);
      expect(this.transformedData.contexts.length).toBe(1);
    });
    it('should contain an experiment object', function () {
      const experiment = this.transformedData.contexts[0];

      expect(typeof experiment.schema).toBe('string');
      expect(experiment.data).toEqual({
        experiment_id: this.data.experiment.id,
        variation: this.data.experiment.variation,
        action: 'action',
        executing_user_id: this.data.userId,
        organization_id: this.data.organizationId,
        space_id: this.data.spaceId
      });
    });
  });
});
