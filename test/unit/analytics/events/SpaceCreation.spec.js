import { deepFreeze } from 'utils/Freeze.es6';
import sinon from 'sinon';

describe('analytics/events/SpaceCreation#entityActionSuccess()', () => {
  beforeEach(async function() {
    this.track = sinon.stub();

    this.system.set('analytics/Analytics.es6', {
      track: this.track
    });

    this.SpaceCreation = await this.system.import('analytics/events/SpaceCreation.es6');
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
    entityData: newEntityData('create', 'entry'),
    tracksOrigin: true
  });
});

function describeTrackingOf({ event, entityData, tracksOrigin = false }) {
  const withOrigin = tracksOrigin ? ' (with `event_origin`)' : '';

  describe(`tracking of \`${event}\`${withOrigin}`, () => {
    it('tracks provided entity data$', function() {
      this.SpaceCreation.entityActionSuccess('ct123', entityData);

      const actualEntityData = tracksOrigin
        ? { ...entityData, eventOrigin: 'space-creation' }
        : entityData;

      sinon.assert.calledWith(this.track, event, actualEntityData);
    });

    it('tracks template if provided', function() {
      const template = 'my template';

      this.SpaceCreation.entityActionSuccess('ct123', entityData, template);

      const actualEntityData = { template, ...entityData };
      if (tracksOrigin) {
        actualEntityData.eventOrigin = 'example-space-creation';
      }

      sinon.assert.calledWith(this.track, event, actualEntityData);
    });
  });
}

function newEntityData(action, entityType) {
  return deepFreeze({
    actionData: { action, entity: entityType }
  });
}