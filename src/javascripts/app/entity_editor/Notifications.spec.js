import { Notification } from '@contentful/forma-36-react-components';
import { makeNotify, Notification as EditorNotification } from 'app/entity_editor/Notifications';

describe('app/entityEditor/Notifications', () => {
  let notify;
  beforeEach(async function () {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
    notify = makeNotify('Entry', () => 'TITLE');
  });

  describe('generic actions', () => {
    // TODO firefox does not yet support for (const x in y)
    /* eslint prefer-const: off */

    const verbs = [
      ['archive', 'archiving', 'archived'],
      ['unarchive', 'unarchiving', 'unarchived'],
      ['unpublish', 'unpublishing', 'unpublished'],
    ];

    it('handles success', function () {
      for (let [inf, _, present] of verbs) {
        notify(EditorNotification.Success(inf));
        expect(Notification.success).toHaveBeenCalledWith(`TITLE ${present} successfully`);
      }
    });

    it('handles error', function () {
      for (let [inf, past, _] of verbs) {
        const error = makeErrorResponse('ERROR ID');
        notify(EditorNotification.Error(inf, error));
        expect(Notification.error).toHaveBeenCalledWith(`Error ${past} TITLE (ERROR ID)`);
      }
    });
  });

  describe('reverting', () => {
    it('handles success', function () {
      notify(EditorNotification.Success('revert'));
      expect(Notification.success).toHaveBeenCalledWith('Discarded changes of TITLE successfully');
    });

    it('handles error', function () {
      notify(EditorNotification.Error('revert'));
      expect(Notification.error).toHaveBeenCalledWith('Error discarding changes of TITLE');
    });
  });

  describe('deleting', () => {
    it('handles success', function () {
      notify(EditorNotification.Success('delete'));
      expect(Notification.success).toHaveBeenCalledWith('Entry deleted successfully');
    });

    it('handles error', function () {
      const error = makeErrorResponse('ERROR');
      notify(EditorNotification.Error('delete', error));
      expect(Notification.error).toHaveBeenCalledWith('Error deleting TITLE (ERROR)');
    });
  });

  describe('duplicating', () => {
    it('handles error', function () {
      notify(EditorNotification.Error('duplicate'));
      expect(Notification.error).toHaveBeenCalledWith('Could not duplicate entry');
    });
  });

  describe('publishing', () => {
    it('handles success', function () {
      notify(EditorNotification.Success('publish'));
      expect(Notification.success).toHaveBeenCalledWith('TITLE published successfully');
    });

    it('handles validation failure', function () {
      notify(EditorNotification.ValidationError());
      expect(Notification.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error publishing TITLE: Validation failed. .*/)
      );
    });

    it('handles "ValidationFailed" response', function () {
      const error = makeErrorResponse('ValidationFailed');
      notify(EditorNotification.Error('publish', error));
      expect(Notification.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error publishing TITLE: Validation failed. .*/)
      );
    });

    it('handles "VersionMismatch" response', function () {
      const error = makeErrorResponse('VersionMismatch');
      notify(EditorNotification.Error('publish', error));
      expect(Notification.error).toHaveBeenCalledWith(
        'Error publishing TITLE: Can only publish most recent version'
      );
    });

    it('handles "UnresolvedLinks" response', function () {
      const error = makeErrorResponse('UnresolvedLinks');
      notify(EditorNotification.Error('publish', error));
      expect(Notification.error).toHaveBeenCalledWith(
        'Error publishing TITLE: Some linked entries are missing.'
      );
    });

    it('handles content type validation response', function () {
      const error = makeErrorResponse('InvalidEntry', 'Validation error', [
        {
          name: 'linkContentType',
          details: 'DETAIL',
        },
      ]);
      notify(EditorNotification.Error('publish', error));
      expect(Notification.error).toHaveBeenCalledWith('Error publishing TITLE: DETAIL');
    });

    it('handles other "InvalidEntry" response', function () {
      const error = makeErrorResponse('InvalidEntry', 'Validation error');
      notify(EditorNotification.Error('publish', error));
      expect(Notification.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error publishing TITLE: Validation failed. .*/)
      );
    });

    it('handles generic server error response', function () {
      const error = makeErrorResponse('Other');
      notify(EditorNotification.Error('publish', error));
      expect(Notification.error).toHaveBeenCalledWith(
        'Publishing TITLE has failed due to a server issue. We have been notified.'
      );
    });
  });

  function makeErrorResponse(id, message, errors) {
    return {
      data: {
        sys: { id: id },
        message: message,
        details: { errors: errors || [] },
      },
    };
  }
});
