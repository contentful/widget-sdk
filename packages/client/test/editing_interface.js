/* jshint expr: true */
const co = require('co');
const {coit, clone} = require('./support');
const {expect} = require('chai');

module.exports = function describeEditingInterface () {
  describe('editing interface', function () {
    const serverData = Object.freeze({
      sys: Object.freeze({
        type: 'EditingInterface',
        id: '11',
        version: 4
      }),
      contentTypeId: 'ctid'
    });

    const contentTypeData = Object.freeze({
      sys: Object.freeze({
        type: 'ContentType',
        id: 'ctid',
        version: 321
      })
    });

    beforeEach(co.wrap(function* () {
      this.request.respond(contentTypeData);
      this.contentType = yield this.space.createContentType(contentTypeData);
      this.request.reset();
    }));


    describe('.createEditingInterface(data)', function () {
      coit('with id sends PUT request', function* () {
        this.request.respond(serverData);
        yield this.contentType.createEditingInterface(clone(serverData));
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          url: '/spaces/42/content_types/ctid/editor_interfaces/11',
          headers: { 'X-Contentful-Version': 4 },
          data: serverData
        });
      });

      coit('without id sends POST request', function* () {
        var initialData = clone(serverData);
        delete initialData.sys.id;

        var data = clone(initialData);
        this.request.respond(serverData);
        var editingInterface = yield this.contentType.createEditingInterface(data);
        expect(editingInterface.data.sys.id).to.equal('11');
        expect(this.request).to.be.calledWith({
          method: 'POST',
          url: '/spaces/42/content_types/ctid/editor_interfaces',
          data: initialData
        });
      });
    });

    describe('.getEditingInterface(id)', function () {
      coit('obtains editing interface from server', function* () {
        this.request.respond(serverData);
        var editingInterface = yield this.contentType.getEditingInterface('id');
        expect(editingInterface.data).to.deep.equal(serverData);
        expect(this.request).to.be.calledWith({
          method: 'GET',
          url: '/spaces/42/content_types/ctid/editor_interfaces/id'
        });
      });
    });

    describe('instance', function () {
      beforeEach(co.wrap(function* () {
        this.request.respond(serverData);
        this.editingInterface = yield this.contentType.createEditingInterface(clone(serverData));
        this.request.reset();
      }));

      describe('#save()', function () {
        coit('with id sends PUT request', function* () {
          this.editingInterface.data.name = 'a new name';
          const editingInterfaceData = clone(this.editingInterface.data);

          this.request.respond(serverData);
          yield this.editingInterface.save();
          expect(this.request).to.be.calledWith({
            method: 'PUT',
            url: '/spaces/42/content_types/ctid/editor_interfaces/11',
            headers: { 'X-Contentful-Version': 4 },
            data: editingInterfaceData
          });
        });

        coit('without id sends POST request', function* () {
          delete this.editingInterface.data.sys.id;
          var initialData = clone(this.editingInterface.data);

          this.request.respond(serverData);
          yield this.editingInterface.save();
          expect(this.request).to.be.calledWith({
            method: 'POST',
            url: '/spaces/42/content_types/ctid/editor_interfaces',
            data: initialData
          });
        });

        it('throws without content type id', function () {
          delete this.editingInterface.data.contentTypeId;
          // TODO return rejected promise
          expect(() => this.editingInterface.save()).to.throw;
        });

        coit('updates entity data');
      });

      coit('#delete()', function* () {
        this.request.respond(null);
        yield this.editingInterface.delete();
        expect(this.request).to.be.calledWith({
          method: 'DELETE',
          url: '/spaces/42/content_types/ctid/editor_interfaces/11'
        });
      });
    });
  });
};
