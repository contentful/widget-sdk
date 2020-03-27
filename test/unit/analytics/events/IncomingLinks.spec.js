import _ from 'lodash';
import sinon from 'sinon';

describe('IncomingLinks', () => {
  beforeEach(async function () {
    this.analytics = {
      track: sinon.stub(),
    };

    this.system.set('analytics/Analytics', this.analytics);

    this.incomingLinksEvents = await this.system.import('analytics/events/IncomingLinks');
  });

  describe('onIncomingLinkClick', () => {
    it('tracks incoming links clicks', function () {
      this.incomingLinksEvents.onIncomingLinkClick({
        origin: this.incomingLinksEvents.Origin.SIDEBAR,
        entityId: 'foo',
        entityType: 'bar',
        linkEntityId: 'baz',
        incomingLinksCount: 19,
      });

      sinon.assert.calledWith(this.analytics.track, 'incoming_links:sidebar_link_click', {
        entity_id: 'foo',
        entity_type: 'bar',
        link_entity_id: 'baz',
        incoming_links_count: 19,
      });
    });

    describe('when the origin is the dialog', () => {
      it('tracks incoming links clicks, including the dialog session id', function () {
        this.incomingLinksEvents.onIncomingLinkClick({
          origin: this.incomingLinksEvents.Origin.DIALOG,
          entityId: 'foo',
          entityType: 'bar',
          linkEntityId: 'baz',
          dialogAction: 'publish',
          dialogSessionId: 'quux',
          incomingLinksCount: 19,
        });

        sinon.assert.calledWith(this.analytics.track, 'incoming_links:dialog_link_click', {
          entity_id: 'foo',
          entity_type: 'bar',
          link_entity_id: 'baz',
          dialog_action: 'publish',
          dialog_session_id: 'quux',
          incoming_links_count: 19,
        });
      });
    });
  });

  describe('onDialogOpen', () => {
    it('tracks the dialog open event', function () {
      this.incomingLinksEvents.onDialogOpen({
        entityId: 'foo',
        entityType: 'bar',
        dialogAction: 'publish',
        dialogSessionId: 'baz',
        incomingLinksCount: 19,
      });

      sinon.assert.calledWith(this.analytics.track, 'incoming_links:dialog_open', {
        entity_id: 'foo',
        entity_type: 'bar',
        dialog_action: 'publish',
        dialog_session_id: 'baz',
        incoming_links_count: 19,
      });
    });
  });

  describe('onDialogConfirm', () => {
    it('tracks the dialog confirm event', function () {
      this.incomingLinksEvents.onDialogConfirm({
        entityId: 'foo',
        entityType: 'bar',
        dialogAction: 'publish',
        dialogSessionId: 'baz',
        incomingLinksCount: 19,
      });

      sinon.assert.calledWith(this.analytics.track, 'incoming_links:dialog_confirm', {
        entity_id: 'foo',
        entity_type: 'bar',
        dialog_action: 'publish',
        dialog_session_id: 'baz',
        incoming_links_count: 19,
      });
    });
  });

  describe('onFetchLinks', () => {
    it('tracks the link fetch event', function () {
      const incomingLinkIds = ['a', 'b', 'c', 'd', 'e'];

      this.incomingLinksEvents.onFetchLinks({
        entityId: 'foo',
        entityType: 'bar',
        incomingLinkIds,
      });

      sinon.assert.calledWith(this.analytics.track, 'incoming_links:query', {
        entity_id: 'foo',
        entity_type: 'bar',
        incoming_links_count: 5,
        incoming_link_ids: incomingLinkIds,
      });
    });
  });
});
