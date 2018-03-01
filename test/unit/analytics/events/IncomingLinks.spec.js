import _ from 'lodash';
import sinon from 'npm:sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('IncomingLinks', function () {
  beforeEach(function* () {
    const system = createIsolatedSystem();

    this.analytics = {
      track: sinon.stub()
    };

    system.set(
      'analytics/Analytics',
      this.analytics
    );

    this.incomingLinksEvents = yield system.import(
      'analytics/events/IncomingLinks'
    );
  });

  describe('onIncomingLinkClick', function () {
    it('tracks incoming links clicks', function () {
      this.incomingLinksEvents.onIncomingLinkClick({
        origin: this.incomingLinksEvents.Origin.SIDEBAR,
        entityId: 'foo',
        entityType: 'bar',
        linkEntityId: 'baz',
        incomingLinksCount: 19
      });

      sinon.assert.calledWith(
        this.analytics.track,
        'incoming_links:sidebar_link_click',
        {
          entity_id: 'foo',
          entity_type: 'bar',
          link_entity_id: 'baz',
          incoming_links_count: 19
        }
      );
    });

    describe('when the origin is the dialog', function () {
      it('tracks incoming links clicks, including the dialog session id', function () {
        this.incomingLinksEvents.onIncomingLinkClick({
          origin: this.incomingLinksEvents.Origin.DIALOG,
          entityId: 'foo',
          entityType: 'bar',
          linkEntityId: 'baz',
          sessionId: 'quux',
          incomingLinksCount: 19
        });

        sinon.assert.calledWith(
          this.analytics.track,
          'incoming_links:dialog_link_click',
          {
            entity_id: 'foo',
            entity_type: 'bar',
            link_entity_id: 'baz',
            dialog_session_id: 'quux',
            incoming_links_count: 19
          }
        );
      });
    });
  });

  describe('onDialogOpen', function () {
    it('tracks the dialog open event', function () {
      this.incomingLinksEvents.onDialogOpen({
        entityId: 'foo',
        entityType: 'bar',
        sessionId: 'baz',
        incomingLinksCount: 19
      });

      sinon.assert.calledWith(
        this.analytics.track,
        'incoming_links:dialog_open',
        {
          entity_id: 'foo',
          entity_type: 'bar',
          dialog_session_id: 'baz',
          incoming_links_count: 19
        }
      );
    });
  });

  describe('onDialogConfirm', function () {
    it('tracks the dialog confirm event', function () {
      this.incomingLinksEvents.onDialogConfirm({
        entityId: 'foo',
        entityType: 'bar',
        sessionId: 'baz',
        incomingLinksCount: 19
      });

      sinon.assert.calledWith(
        this.analytics.track,
        'incoming_links:dialog_confirm',
        {
          entity_id: 'foo',
          entity_type: 'bar',
          dialog_session_id: 'baz',
          incoming_links_count: 19
        }
      );
    });
  });

  describe('onFetchLinks', function () {
    it('tracks the link fetch event', function () {
      this.incomingLinksEvents.onFetchLinks({
        entityId: 'foo',
        entityType: 'bar',
        incomingLinksCount: 19
      });

      sinon.assert.calledWith(
        this.analytics.track,
        'incoming_links:query',
        {
          entity_id: 'foo',
          entity_type: 'bar',
          incoming_links_count: 19
        }
      );
    });
  });
});
