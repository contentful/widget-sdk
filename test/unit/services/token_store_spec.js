'use strict';

describe('Token store service', function () {

  beforeEach(function () {
    module('contentful/test');

    this.K = this.$inject('mocks/kefir');
    this.tokenStore = this.$inject('tokenStore');

    this.auth = this.$inject('authentication');
    this.auth.getTokenLookup = sinon.stub();

    this.client = this.$inject('client');
    this.client.newSpace = sinon.stub();

    this.user = {firstName: 'hello'};

    this.rawSpaces = _.map(['a-space', 'b-space', 'c-space'], function (name) {
      return {sys: {id: name + '-id'}, name: name};
    });

    this.spaces = _.map(this.rawSpaces, function (raw) {
      return {
        data: _.cloneDeep(raw),
        getId: _.constant(raw.sys.id),
        update: sinon.stub()
      };
    });

    this.refresh = function () {
      this.tokenStore.refreshWithLookup({
        sys: {createdBy: this.user},
        spaces: Array.prototype.slice.apply(arguments)
      });
    }.bind(this);
  });

  describe('#refreshWithLookup', function () {
    beforeEach(function () {
      this.client.newSpace.returns(this.spaces[0]);
      this.refresh(this.rawSpaces[0]);
    });

    it('updates user$ property', function () {
      this.K.assertCurrentValue(this.tokenStore.user$, this.user);
    });

    it('updates spaces$ property', function () {
      this.K.assertCurrentValue(this.tokenStore.spaces$, [this.spaces[0]]);
    });

    it('modifies space object if already stored', function () {
      this.refresh(this.rawSpaces[0]);
      sinon.assert.calledOnce(this.spaces[0].update.withArgs(this.rawSpaces[0]));
    });

    it('stores added, new space', function () {
      this.client.newSpace.returns(this.spaces[1]);
      this.refresh(this.rawSpaces[0], this.rawSpaces[1]);
      sinon.assert.calledTwice(this.client.newSpace);
      this.K.assertCurrentValue(this.tokenStore.spaces$, [this.spaces[0], this.spaces[1]]);
    });

    it('sorts spaces by name', function () {
      this.client.newSpace.returns(this.spaces[2]);
      this.refresh(this.rawSpaces[2], this.rawSpaces[0]);
      this.K.assertCurrentValue(this.tokenStore.spaces$, [this.spaces[0], this.spaces[2]]);
    });

    it('removes stored space if not present in a new token', function () {
      this.client.newSpace.returns(this.spaces[1]);
      this.refresh(this.rawSpaces[0], this.rawSpaces[1]);
      this.refresh(this.rawSpaces[0]);
      this.K.assertCurrentValue(this.tokenStore.spaces$, [this.spaces[0]]);
    });
  });

  describe('#refresh()', function () {
    pit('fetches token returns promise of token refresh', function () {
      this.client.newSpace.returns(this.spaces[0]);
      this.auth.getTokenLookup.resolves({
        sys: {createdBy: this.user},
        spaces: [this.rawSpaces[0]]
      });

      return this.tokenStore.refresh().then(function () {
        sinon.assert.calledOnce(this.auth.getTokenLookup);
      }.bind(this));
    });
  });

  it('reuses promise if some requests are in progress', function () {
    const d = this.auth.getTokenLookup.defers();
    const promise = this.tokenStore.refresh();
    expect(this.tokenStore.refresh()).toBe(promise);

    d.resolve({sys: {createdBy: this.user}, spaces: []});
    this.$apply();
    expect(this.tokenStore.refresh()).not.toBe(promise);
  });

  it('shows dialog and clears auth data on 401', function () {
    const dialog = this.$inject('modalDialog');
    dialog.open = sinon.stub().returns({promise: this.$inject('$q').resolve()});
    this.auth.clearAndLogin = sinon.spy();
    this.auth.getTokenLookup.rejects({statusCode: 401});

    this.tokenStore.refresh();
    this.$apply();
    sinon.assert.calledOnce(dialog.open);
    sinon.assert.calledOnce(this.auth.clearAndLogin);
  });

  it('reloads app on =/= 401', function () {
    const notification = this.$inject('ReloadNotification');
    notification.trigger = sinon.spy();
    this.auth.getTokenLookup.rejects({statusCode: 404});

    this.tokenStore.refresh();
    this.$apply();
    sinon.assert.calledOnce(notification.trigger);
  });

  describe('#getSpaces()', function () {
    pit('returns promise resolving to currently stored spaces', function () {
      this.client.newSpace.returns(this.spaces[0]);
      this.refresh(this.rawSpaces[0]);

      return this.tokenStore.getSpaces().then(function (spaces) {
        expect(spaces.length).toBe(1);
        expect(spaces[0]).toBe(this.spaces[0]);
      }.bind(this));
    });

    it('waits for a request in progress', function () {
      const d = this.auth.getTokenLookup.defers();
      this.tokenStore.refresh();

      const spaceHandler = sinon.spy();
      this.tokenStore.getSpace('a-space-id').then(spaceHandler);
      sinon.assert.notCalled(spaceHandler);

      this.client.newSpace.returns(this.spaces[0]);
      d.resolve({sys: {createdBy: this.user}, spaces: [this.rawSpaces[0]]});
      this.$apply();
      sinon.assert.calledOnce(spaceHandler);
    });
  });

  describe('#getSpace()', function () {
    pit('returns promise resolving to requested space', function () {
      this.client.newSpace.returns(this.spaces[0]);
      this.refresh(this.rawSpaces[0]);

      return this.tokenStore.getSpace('a-space-id').then(function (space) {
        expect(space).toBe(this.spaces[0]);
      }.bind(this));
    });

    pit('returns rejected promise if space cannot be found', function () {
      return this.tokenStore.getSpace('xyz').then(_.noop, function (err) {
        expect(err instanceof Error).toBe(true);
        expect(err.message).toBe('No space with given ID could be found.');
      });
    });
  });

  describe('#user$', function () {
    it('is initially null', function () {
      this.K.assertCurrentValue(this.tokenStore.user$, null);
    });

    it('updates user when tokenStore is refreshed', function () {
      this.refresh();
      this.K.assertCurrentValue(this.tokenStore.user$, this.user);
    });
  });

  describe('#spaces$', function () {
    it('is initially empty', function () {
      this.K.assertCurrentValue(this.tokenStore.spaces$, []);
    });

    it('updates spaces when tokenStore is refreshed', function () {
      this.client.newSpace.returns(this.spaces[0]);
      this.refresh(this.rawSpaces[0]);
      this.K.assertCurrentValue(this.tokenStore.spaces$, [this.spaces[0]]);
    });
  });
});
