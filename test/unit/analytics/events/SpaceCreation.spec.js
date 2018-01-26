'use strict';

import { deepFreeze } from 'utils/Freeze';

describe('analytics/events/SpaceCreation#entityActionSuccess()', function () {
  beforeEach(function () {
    module('contentful/test');
    this.analytics = this.$inject('analytics/Analytics');
    this.analytics.track = sinon.stub();
    this.SpaceCreation = this.$inject('analytics/events/SpaceCreation');
  });

  describeTrackingOf({
    event: 'content_type:create',
    entityData: newEntityData('create', 'ContentType')
  });

  describeTrackingOf({
    event: 'asset:create',
    entityData: newEntityData('create', 'asset')
  });

  describeTrackingOf({
    event: 'api_key:create',
    entityData: newEntityData('create', 'api_key')
  });

  describeTrackingOf({
    event: 'entry:create',
    entityData: newEntityData('create', 'entry')
  });
});

function describeTrackingOf ({ event, entityData }) {
  describe(`tracking of \`${event}\``, function () {
    it('tracks provided entity data', function () {
      this.SpaceCreation.entityActionSuccess('ct123', entityData);

      sinon.assert.calledWith(
        this.analytics.track, event, entityData);
    });

    it('tracks template if provided', function () {
      const template = 'my template';

      this.SpaceCreation.entityActionSuccess(
        'ct123', entityData, template);

      const actualEntityData = _.extend({ template }, entityData);

      sinon.assert.calledWith(
        this.analytics.track, event, actualEntityData
      );
    });
  });
}

function newEntityData (action, entityType) {
  return deepFreeze({
    actionData: { action, entity: entityType }
  });
}
