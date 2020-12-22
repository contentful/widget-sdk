import _ from 'lodash';
import * as incomingLinksEvents from './IncomingLinks';
import * as analytics from 'analytics/Analytics';

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('IncomingLinks', () => {
  describe('onIncomingLinkClick', () => {
    it('tracks incoming links clicks', function () {
      incomingLinksEvents.onIncomingLinkClick({
        origin: incomingLinksEvents.Origin.SIDEBAR,
        entityId: 'foo',
        entityType: 'bar',
        linkEntityId: 'baz',
        incomingLinksCount: 19,
      });

      expect(analytics.track).toHaveBeenCalledWith('incoming_links:sidebar_link_click', {
        entity_id: 'foo',
        entity_type: 'bar',
        link_entity_id: 'baz',
        incoming_links_count: 19,
      });
    });

    describe('when the origin is the dialog', () => {
      it('tracks incoming links clicks, including the dialog session id', function () {
        incomingLinksEvents.onIncomingLinkClick({
          origin: incomingLinksEvents.Origin.DIALOG,
          entityId: 'foo',
          entityType: 'bar',
          linkEntityId: 'baz',
          dialogAction: 'publish',
          dialogSessionId: 'quux',
          incomingLinksCount: 19,
        });

        expect(analytics.track).toHaveBeenCalledWith('incoming_links:dialog_link_click', {
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
      incomingLinksEvents.onDialogOpen({
        entityId: 'foo',
        entityType: 'bar',
        dialogAction: 'publish',
        dialogSessionId: 'baz',
        incomingLinksCount: 19,
      });

      expect(analytics.track).toHaveBeenCalledWith('incoming_links:dialog_open', {
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
      incomingLinksEvents.onDialogConfirm({
        entityId: 'foo',
        entityType: 'bar',
        dialogAction: 'publish',
        dialogSessionId: 'baz',
        incomingLinksCount: 19,
      });

      expect(analytics.track).toHaveBeenCalledWith('incoming_links:dialog_confirm', {
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

      incomingLinksEvents.onFetchLinks({
        entityId: 'foo',
        entityType: 'bar',
        incomingLinkIds,
      });

      expect(analytics.track).toHaveBeenCalledWith('incoming_links:query', {
        entity_id: 'foo',
        entity_type: 'bar',
        incoming_links_count: 5,
        incoming_link_ids: incomingLinkIds,
      });
    });
  });
});
