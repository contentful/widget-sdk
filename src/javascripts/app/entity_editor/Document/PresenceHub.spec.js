import { waitFor } from '@testing-library/dom';
import * as K from '__mocks__/kefirMock';
import { createPresenceHub } from './PresenceHub';

jest.mock('core/NgRegistry', () => ({
  getModule: () => (fn, timeout) => setInterval(fn, timeout),
}));

jest.useFakeTimers();

describe('app/entity_editor/Document/PresenceHub', () => {
  let shout, receiveShout, presence;
  function extractUserIds(userStream) {
    return K.extractValues(
      userStream.map((users = []) => {
        return users.map((user) => user.sys.id);
      })
    );
  }

  beforeEach(async function () {
    shout = jest.fn();

    const docEvents = K.createMockStream();

    receiveShout = function (data) {
      docEvents.emit({ name: 'shout', data });
    };

    presence = createPresenceHub('ownUser', docEvents, shout);
  });

  describe('#collaborators', () => {
    it('adds users when presence is shouted', function () {
      const idsStream = extractUserIds(presence.collaborators);
      receiveShout(['ping', 'sourceUser']);
      expect(idsStream[0]).toEqual(['sourceUser']);
    });

    it('removes uers when close is shouted', function () {
      const idsStream = extractUserIds(presence.collaborators);
      receiveShout(['ping', 'sourceUser']);
      expect(idsStream[0]).toEqual(['sourceUser']);

      receiveShout(['close', 'sourceUser']);
      expect(idsStream[0]).toEqual([]);
    });

    it('removes users after time out', async function () {
      const advanceDate = (ms = 0, spy) => {
        const date = new Date();
        spy?.mockRestore();
        const newDate = new Date(date.getTime() + ms);
        return jest.spyOn(global, 'Date').mockImplementation(() => newDate);
      };

      const idsStream = extractUserIds(presence.collaborators);

      let spy = advanceDate();
      receiveShout(['ping', 'userA']);

      spy = advanceDate(1000, spy);

      receiveShout(['ping', 'userB']);

      await waitFor(() => expect(idsStream[0]).toEqual(['userA', 'userB']));

      spy = advanceDate(60e3 - 500, spy);
      jest.advanceTimersByTime(60e3);

      await waitFor(() => expect(idsStream[0]).toEqual(['userB']));

      spy = advanceDate(1000, spy);
      jest.advanceTimersByTime(60e3);
      await waitFor(() => expect(idsStream[0]).toEqual([]));

      spy.mockRestore();
    });
  });

  describe('#collaboratorsFor', () => {
    it('adds user to field when presence is shouted', function () {
      const idsStream = extractUserIds(presence.collaboratorsFor('FID', 'LID'));
      receiveShout(['focus', 'userA', 'fields.FID.LID']);
      receiveShout(['focus', 'userB', 'fields.FID.LID']);
      receiveShout(['focus', 'userC', 'fields.FID.LID-2']);
      expect(idsStream[0]).toEqual(['userA', 'userB']);
    });
  });

  describe('on "open" shout', () => {
    it('shouts back "focus" when field has been focused', function () {
      presence.focus('FID', 'LID');
      shout.mockClear();
      receiveShout(['open', 'sourceUser']);
      expect(shout).toHaveBeenCalledWith(['focus', 'ownUser', 'fields.FID.LID']);
    });

    it('shouts back "ping" when no field has been focused', function () {
      shout.mockClear();
      receiveShout(['open', 'sourceUser']);
      expect(shout).toHaveBeenCalledWith(['ping', 'ownUser']);
    });
  });

  describe('#leave()', () => {
    it('shouts "close" with user id', function () {
      shout.mockClear();
      presence.leave();
      expect(shout).toHaveBeenCalledWith(['close', 'ownUser']);
    });
  });

  describe('#focus', () => {
    it('shouts field focus', function () {
      presence.focus('FID', 'LID');
      expect(shout).toHaveBeenCalledWith(['focus', 'ownUser', 'fields.FID.LID']);
    });

    it('throttles shout calls', function () {
      presence.focus('FID', 'LID');
      presence.focus('FID', 'LID');
      expect(shout).toHaveBeenCalledTimes(1);
    });

    it('does not throttle shout calls to different fields', function () {
      presence.focus('FID', 'LID');
      presence.focus('FID2', 'LID');
      expect(shout).toHaveBeenCalledTimes(2);
    });
  });
});
