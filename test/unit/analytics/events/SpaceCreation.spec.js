'use strict';

describe('Space template analytics events', function () {
  beforeEach(function () {
    module('contentful/test');
    this.analytics = this.$inject('analytics/Analytics');
    this.analytics.track = sinon.stub();
    this.spaceTemplateEvents = this.$inject('analytics/events/SpaceCreation');
    this.entity = {actionData: {action: 'create', entity: 'ContentType'}};
  });

  it('create space without template', function () {
    this.spaceTemplateEvents.entityActionSuccess('ct123', this.entity);
    sinon.assert.calledWith(this.analytics.track, 'content_type:create', this.entity);
  });

  it('create space from template', function () {
    this.spaceTemplateEvents.entityActionSuccess('ct123', this.entity, 'my template');
    sinon.assert.calledWith(
      this.analytics.track,
      'content_type:create',
      _.extend({template: 'my template'}, this.entity)
    );
  });
});
