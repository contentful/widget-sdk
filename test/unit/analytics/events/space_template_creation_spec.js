'use strict';

describe('Space template analytics events', function () {
  beforeEach(function () {
    module('contentful/test');
    this.spaceTemplateEvents = this.$inject('analytics/events/space_template_creation');
    this.analytics = this.$inject('analytics');
    this.analytics.track = sinon.stub();
  });

  it('calls analytics.track()', function () {
    const entity = {actionData: {action: 'create', entity: 'ContentType'}};
    this.spaceTemplateEvents.entityActionSuccess('ct123', entity);
    sinon.assert.calledWith(this.analytics.track, 'content_type:create', entity);
  });
});
