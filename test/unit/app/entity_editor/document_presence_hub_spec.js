import * as K from 'helpers/mocks/kefir';

describe('entityEditor/Document/PresenceHub', () => {
  function extractUserIds (userStream) {
    return K.extractValues(userStream.map((users = []) => {
      return users.map((user) => user.sys.id);
    }));
  }

  beforeEach(function () {
    module('contentful/test');

    this.shout = sinon.stub();

    const docEvents = K.createMockStream();

    this.receiveShout = function (data) {
      docEvents.emit({name: 'shout', data});
      this.$apply();
    };

    const PresenceHub = this.$inject('entityEditor/Document/PresenceHub');
    this.presence = PresenceHub.create('ownUser', docEvents, this.shout);
  });

  describe('#collaborators', () => {
    it('adds users when presence is shouted', function () {
      const idsStream = extractUserIds(this.presence.collaborators);
      this.receiveShout(['ping', 'sourceUser']);
      expect(idsStream[0]).toEqual(['sourceUser']);
    });

    it('removes uers when close is shouted', function () {
      const idsStream = extractUserIds(this.presence.collaborators);
      this.receiveShout(['ping', 'sourceUser']);
      expect(idsStream[0]).toEqual(['sourceUser']);

      this.receiveShout(['close', 'sourceUser']);
      expect(idsStream[0]).toEqual([]);
    });

    it('removes users after time out', function () {
      const $interval = this.$inject('$interval');
      const clock = sinon.useFakeTimers();
      const idsStream = extractUserIds(this.presence.collaborators);

      this.receiveShout(['ping', 'userA']);
      clock.tick(1000);
      this.receiveShout(['ping', 'userB']);

      expect(idsStream[0]).toEqual(['userA', 'userB']);

      clock.tick(60e3 - 500);
      $interval.flush(60e3);
      expect(idsStream[0]).toEqual(['userB']);

      clock.tick(1000);
      $interval.flush(60e3);
      expect(idsStream[0]).toEqual([]);

      clock.restore();
    });
  });

  describe('#collaboratorsFor', () => {
    it('adds user to field when presence is shouted', function () {
      const idsStream = extractUserIds(this.presence.collaboratorsFor('FID', 'LID'));
      this.receiveShout(['focus', 'userA', 'fields.FID.LID']);
      this.receiveShout(['focus', 'userB', 'fields.FID.LID']);
      this.receiveShout(['focus', 'userC', 'fields.FID.LID-2']);
      expect(idsStream[0]).toEqual(['userA', 'userB']);
    });
  });

  describe('on "open" shout', () => {
    it('shouts back "focus" when field has been focused', function () {
      this.presence.focus('FID', 'LID');
      this.shout.reset();
      this.receiveShout(['open', 'sourceUser']);
      sinon.assert.calledWith(this.shout, ['focus', 'ownUser', 'fields.FID.LID']);
    });

    it('shouts back "ping" when no field has been focused', function () {
      this.shout.reset();
      this.receiveShout(['open', 'sourceUser']);
      this.$apply();
      sinon.assert.calledWith(this.shout, ['ping', 'ownUser']);
    });
  });

  describe('#leave()', () => {
    it('shouts "close" with user id', function () {
      this.shout.reset();
      this.presence.leave();
      sinon.assert.calledWithExactly(this.shout, ['close', 'ownUser']);
    });
  });

  describe('#focus', () => {
    it('shouts field focus', function () {
      this.presence.focus('FID', 'LID');
      sinon.assert.calledWithExactly(this.shout, ['focus', 'ownUser', 'fields.FID.LID']);
    });

    it('throttles shout calls', function () {
      this.presence.focus('FID', 'LID');
      this.presence.focus('FID', 'LID');
      sinon.assert.calledOnce(this.shout);
    });

    it('does not throttle shout calls to different fields', function () {
      this.presence.focus('FID', 'LID');
      this.presence.focus('FID2', 'LID');
      sinon.assert.calledTwice(this.shout);
    });
  });
});
