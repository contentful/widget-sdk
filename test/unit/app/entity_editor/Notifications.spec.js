describe('app/entityEditor/Notifications', () => {
  beforeEach(function() {
    module('contentful/test');
    this.notification = this.mockService('notification');
    const N = this.$inject('app/entity_editor/Notifications');
    this.Notification = N.Notification;
    this.notify = N.makeNotify('Entry', () => 'TITLE');
  });

  describe('generic actions', () => {
    // TODO firefox does not yet support for (const x in y)
    /* eslint prefer-const: off */

    const verbs = [
      ['archive', 'archiving', 'archived'],
      ['unarchive', 'unarchiving', 'unarchived'],
      ['unpublish', 'unpublishing', 'unpublished']
    ];

    it('handles success', function() {
      for (let [inf, _, present] of verbs) {
        this.notify(this.Notification.Success(inf));
        sinon.assert.calledWith(this.notification.info, `TITLE ${present} successfully`);
      }
    });

    it('handles error', function() {
      for (let [inf, past, _] of verbs) {
        const error = makeErrorResponse('ERROR ID');
        this.notify(this.Notification.Error(inf, error));
        sinon.assert.calledWith(this.notification.error, `Error ${past} TITLE (ERROR ID)`);
      }
    });
  });

  describe('reverting', () => {
    it('handles success', function() {
      this.notify(this.Notification.Success('revert'));
      sinon.assert.calledWith(this.notification.info, 'Discarded changes of TITLE successfully');
    });

    it('handles error', function() {
      this.notify(this.Notification.Error('revert'));
      sinon.assert.calledWith(this.notification.error, 'Error discarding changes of TITLE');
    });
  });

  describe('deleting', () => {
    it('handles success', function() {
      this.notify(this.Notification.Success('delete'));
      sinon.assert.calledWith(this.notification.info, 'Entry deleted successfully');
    });

    it('handles error', function() {
      const error = makeErrorResponse('ERROR');
      this.notify(this.Notification.Error('delete', error));
      sinon.assert.calledWith(this.notification.error, 'Error deleting TITLE (ERROR)');
    });
  });

  describe('duplicating', () => {
    it('handles error', function() {
      this.notify(this.Notification.Error('duplicate'));
      sinon.assert.calledWith(this.notification.error, 'Could not duplicate entry');
    });
  });

  describe('publishing', () => {
    it('handles success', function() {
      this.notify(this.Notification.Success('publish'));
      sinon.assert.calledWith(this.notification.info, 'TITLE published successfully');
    });

    it('handles validation failure', function() {
      this.notify(this.Notification.ValidationError());
      sinon.assert.calledWith(
        this.notification.error,
        sinon.match(/Error publishing TITLE: Validation failed. .*/)
      );
    });

    it('handles "ValidationFailed" response', function() {
      const error = makeErrorResponse('ValidationFailed');
      this.notify(this.Notification.Error('publish', error));
      sinon.assert.calledWith(
        this.notification.error,
        sinon.match(/Error publishing TITLE: Validation failed. .*/)
      );
    });

    it('handles "VersionMismatch" response', function() {
      const error = makeErrorResponse('VersionMismatch');
      this.notify(this.Notification.Error('publish', error));
      sinon.assert.calledWith(
        this.notification.error,
        'Error publishing TITLE: Can only publish most recent version'
      );
    });

    it('handles "UnresolvedLinks" response', function() {
      const error = makeErrorResponse('UnresolvedLinks');
      this.notify(this.Notification.Error('publish', error));
      sinon.assert.calledWith(
        this.notification.error,
        'Error publishing TITLE: Some linked entries are missing.'
      );
    });

    it('handles content type validation response', function() {
      const error = makeErrorResponse('InvalidEntry', 'Validation error', [
        {
          name: 'linkContentType',
          details: 'DETAIL'
        }
      ]);
      this.notify(this.Notification.Error('publish', error));
      sinon.assert.calledWith(this.notification.error, 'Error publishing TITLE: DETAIL');
    });

    it('handles other "InvalidEntry" response', function() {
      const error = makeErrorResponse('InvalidEntry', 'Validation error');
      this.notify(this.Notification.Error('publish', error));
      sinon.assert.calledWith(
        this.notification.error,
        sinon.match(/Error publishing TITLE: Validation failed. .*/)
      );
    });

    it('handles generic server error response', function() {
      const error = makeErrorResponse('Other');
      this.notify(this.Notification.Error('publish', error));
      sinon.assert.calledWith(
        this.notification.error,
        'Publishing TITLE has failed due to a server issue. We have been notified.'
      );
    });
  });

  function makeErrorResponse(id, message, errors) {
    return {
      data: {
        sys: { id: id },
        message: message,
        details: { errors: errors || [] }
      }
    };
  }
});
