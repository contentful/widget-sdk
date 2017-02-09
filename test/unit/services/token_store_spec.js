'use strict';

// @TODO update and enable tests!
xdescribe('Token store', function () {
  describe('Token store service', function () {
    beforeEach(function () {
      module('contentful/test');

      this.K = this.$inject('mocks/kefir');
      this.lookup = this.$inject('tokenStore/lookup');
      this.lookup.init = sinon.stub();
      this.tokenStore = this.$inject('tokenStore');
      this.auth = this.$inject('authentication');
      this.client = this.$inject('client');
      this.client.newSpace = sinon.stub();

      this.user = {firstName: 'hello'};

      this.rawSpaces = _.map(['a-space', 'b-space', 'c-space'], function (name) {
        return {
          name: name,
          sys: {id: name + '-id'},
          organization: {sys: {id: 'testorg'}}
        };
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

      it('updates spacesByOrganization$ property', function () {
        this.K.assertMatchCurrentValue(
          this.tokenStore.spacesByOrganization$,
          sinon.match({testorg: [this.spaces[0]]})
        );
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
        this.lookup.init.resolves({
          sys: {createdBy: this.user},
          spaces: [this.rawSpaces[0]]
        });

        return this.tokenStore.refresh().then(function () {
          sinon.assert.calledOnce(this.lookup.init);
        }.bind(this));
      });
    });

    it('reuses promise if some requests are in progress', function () {
      const d = this.lookup.init.defers();
      const promise = this.tokenStore.refresh();
      expect(this.tokenStore.refresh()).toBe(promise);

      d.resolve({sys: {createdBy: this.user}, spaces: []});
      this.$apply();
      expect(this.tokenStore.refresh()).not.toBe(promise);
    });

    it('reloads app on =/= 401', function () {
      const notification = this.$inject('ReloadNotification');
      notification.trigger = sinon.spy();
      this.lookup.init.rejects({statusCode: 404});

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
        const d = this.lookup.init.defers();
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

    describe('#spacesByOrganization$', function () {
      it('is initially empty', function () {
        this.K.assertCurrentValue(this.tokenStore.spacesByOrganization$, {});
      });

      it('updates property when tokenStore is refreshed', function () {
        this.client.newSpace.returns(this.spaces[0]);
        this.refresh(this.rawSpaces[0]);
        this.K.assertMatchCurrentValue(
          this.tokenStore.spacesByOrganization$,
          sinon.match({testorg: [this.spaces[0]]})
        );
      });
    });
  });

  describe('Token store lookup service', function () {
    beforeEach(function () {
      module('contentful/test');
      this.lookup = this.$inject('tokenStore/lookup');
      this.QueryLinkResolver = this.$inject('libs/@contentful/client').QueryLinkResolver;
      this.TheStore = this.$inject('TheStore');
      this.TheStore.get = sinon.stub().withArgs('token').returns('my-token');
    });

    describe('#init()', function () {
      let clientTokenLookupStub;
      beforeEach(function () {
        const client = this.$inject('client');
        clientTokenLookupStub = sinon.stub(client, 'getTokenLookup');
      });

      afterEach(function () {
        clientTokenLookupStub.restore();
      });

      describe('call fails', function () {
        let tokenLookup, errorResponse;
        beforeEach(function () {
          errorResponse = {error: 'response'};
          clientTokenLookupStub.returns(this.reject(errorResponse));
          tokenLookup = this.lookup.init();
          this.$apply();
        });

        it('client token lookup is called', function () {
          sinon.assert.called(clientTokenLookupStub);
        });

        it('client token lookup promise fails', function () {
          this.$apply(function () {
            tokenLookup.catch(function (error) {
              expect(error).toBe(errorResponse);
            });
          });
        });
      });

      describe('call succeeds', function () {
        beforeEach(function () {
          this.dataResponse = {token: 'lookup', sys: {}};
          clientTokenLookupStub.resolves({items: [this.dataResponse]});
          this.lookup.init();
          this.$apply();
        });

        it('client token lookup is called', function () {
          sinon.assert.called(clientTokenLookupStub);
        });

        it('client token lookup is set', function () {
          expect(this.lookup.get()).toEqual(this.dataResponse);
        });
      });
    });

    describe('set token lookup', function () {
      let tokenLookup;
      beforeEach(function () {
        tokenLookup = {token: 'lookup'};
        this.QueryLinkResolver.resolveQueryLinks = sinon.stub().returns(['resolvedLink']);
        this.lookup.set(tokenLookup);
      });

      it('queryLinkResolver is called with tokenLookup', function () {
        sinon.assert.calledWith(this.QueryLinkResolver.resolveQueryLinks, tokenLookup);
      });

      it('is parsed by querylink resolver', function () {
        expect(this.lookup.get()).toBe('resolvedLink');
      });
    });

    describe('update token lookup', function () {
      beforeEach(function () {
        this.QueryLinkResolver.resolveQueryLinks = function (u) { return [u]; };
        this.oldTokenLookup = {
          includes: {
            Foo: [
              {sys: {id: '1'}},
              {sys: {id: '2'}} ]},
          items: [{
            spaces: [
              {name: 'HerpSpace', sys: {id: 'herp'}},
              {name: 'DerpSpace', sys: {id: 'derp'}} ]}]
        };

        this.newTokenLookup = {
          includes: {
            Foo: [
              {sys: {id: '1'}},
              {sys: {id: '2'}, updated: true}
            ],
            Bar: [
              {sys: {id: '3'}}
            ]},
          items: [{
            spaces: [
              {name: 'HerpSpace', sys: {id: 'herp'}, updated: true}
            ]}]
        };

        this.lookup.set(this.oldTokenLookup);
      });

      it('should merge includes', function () {
        this.lookup.update(this.newTokenLookup);
        const t = this.lookup.get();
        expect(t.includes.Foo[0].updated).toBe(undefined);
        expect(t.includes.Foo[1].updated).toBe(true);
        expect(t.includes.Bar[0].sys.id).toBe('3');
      });

      it('should update spaces', function () {
        this.lookup.update(this.newTokenLookup);
        const t = this.lookup.get();
        expect(t.items[0].spaces[0].updated).toBe(true);
        expect(t.items[0].spaces[1].updated).toBe(undefined);
      });

      it('should append new includes and items', function () {
        this.newTokenLookup.includes.Foo.push({sys: {id: 'new3'}});
        this.newTokenLookup.items[0].spaces.push({
          name: 'HerpDerp', sys: {id: 'herpderp'}
        });
        this.lookup.update(this.newTokenLookup);
        const t = this.lookup.get();
        expect(t.includes.Foo[2].sys.id).toBe('new3');
        expect(t.items[0].spaces[2].name).toBe('HerpDerp');
      });
    });
  });
});
