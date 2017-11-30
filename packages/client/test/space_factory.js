const {expect, coit} = require('./support');
const Space = require('../lib/space');

module.exports = function spaceFactoryDescription (serverSpaceData, serverSpaceList) {
  describe('factory', function () {
    describe('.getSpace(id)', function () {
      coit('returns instance', function* () {
        this.request.respond(serverSpaceData);
        var space = yield this.client.getSpace('42');
        expect(space).to.be.instanceOf(Space);
        expect(space.data).to.deep.equal(serverSpaceData);
        expect(this.request).to.be.calledWith({
          method: 'GET',
          url: '/spaces/42'
        });
      });

      it('get without id throws', function () {
        expect(() => this.client.getSpace()).to.throw('No id provided');
      });

      coit('get nonexistent id', function* () {
        this.request.throw(new Error('Space not found'));
        yield expect(this.client.getSpace('42')).to.be.rejected;
      });
    });

    coit('.getSpaces(query)', function* () {
      this.request.respond(serverSpaceList);
      var [space] = yield this.client.getSpaces('myquery');
      expect(space).to.be.instanceOf(Space);
      expect(space.data).to.deep.equal(serverSpaceData);
      expect(this.request).to.be.calledWith({
        method: 'GET',
        url: '/spaces',
        params: 'myquery'
      });
    });

    describe('.createSpace(data, org)', function () {
      coit('create on server', function* () {
        this.request.respond(serverSpaceData);
        var space = yield this.client.createSpace({name: 'newspace'}, 'myorganisation');
        expect(space.getId()).to.equal('42');
        expect(this.request).to.be.calledWith({
          method: 'POST',
          url: '/spaces',
          headers: { 'X-Contentful-Organization': 'myorganisation' },
          data: { name: 'newspace' }
        });
      });

      coit('create with id saves space', function* () {
        this.request.respond(serverSpaceData);
        yield this.client.createSpace(serverSpaceData, 'myorganisation');
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          url: '/spaces/42',
          headers: { 'X-Contentful-Organization': 'myorganisation' },
          data: serverSpaceData
        });
      });
    });
  });
};
