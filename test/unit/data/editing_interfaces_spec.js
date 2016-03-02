'use strict';

describe('data/editingInterfaces', function () {
  var editingInterfaces, spaceEndpoint, contentType;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('widgets/default', sinon.stub());
    });

    spaceEndpoint = sinon.stub().defers();
    var createEditingInterfaces = this.$inject('data/editingInterfaces');
    editingInterfaces = createEditingInterfaces(spaceEndpoint);

    contentType = {
      sys: {},
      fields: [
        {apiName: 'FIELD'}
      ]
    };
  });

  describe('#get()', function () {

    describe('with saved Content Type', function() {
      beforeEach(function() {
        contentType.sys.version = 1;
        spaceEndpoint.resolves();
      });

      it('sends GET request to the editing interface endpoint for the content type', function() {
        spaceEndpoint.resolves();
        contentType.sys.id = 'CTID';
        editingInterfaces.get(contentType);
        sinon.assert.calledWith(spaceEndpoint, {
          method: 'GET',
          path: ['content_types', 'CTID', 'editor_interfaces', 'default']
        });
      });

      describe('with API response', function () {
        beforeEach(function() {
          spaceEndpoint.resolves({
            widgets: [{
              fieldId: 'FIELD',
              widgetId: 'WIDGET'
            }]
          });
        });

        pit('returns editing interface with widgets', function() {
          return editingInterfaces.get(contentType)
          .then(function (ei) {
            expect(ei.widgets.length).toEqual(1);
          });
        });
      });

      pit('resolves with the default interface if a 404 is returned', function () {
        var getDefaultWidget = this.$inject('widgets/default');
        getDefaultWidget.returns('DEFAULT');

        spaceEndpoint.rejects({status: 404});
        return editingInterfaces.get(contentType)
        .then(function (ei) {
          expect(ei.widgets[0].widgetId).toEqual('DEFAULT');
        });
      });

      it('fails if API responds with an error', function() {
        spaceEndpoint.rejects({status: 500});

        var errorHandler = sinon.stub();
        editingInterfaces.get(contentType).catch(errorHandler);
        this.$apply();
        sinon.assert.calledWithExactly(errorHandler, {status: 500});
      });

    });

    describe('when content type is new', function () {
      beforeEach(function () {
        contentType.sys.version = 0;
      });

      it('does not send GET request', function () {
        editingInterfaces.get(contentType);
        sinon.assert.notCalled(spaceEndpoint);
      });

      pit('resolves with the default interface', function () {
        var getDefaultWidget = this.$inject('widgets/default');
        getDefaultWidget.returns('DEFAULT');

        return editingInterfaces.get(contentType)
        .then(function (ei) {
          expect(ei.widgets[0].widgetId).toEqual('DEFAULT');
        });
      });
    });
  });

  describe('#save()', function () {
    beforeEach(function () {
      contentType.sys.id = 'CTID';
    });

    it('sends PUT request with version', function () {
      editingInterfaces.save(contentType, {
        sys: {version: 'V'}
      });
      sinon.assert.calledWith(spaceEndpoint, sinon.match({
        method: 'PUT',
        path: ['content_types', 'CTID', 'editor_interfaces', 'default'],
        version: 'V',
      }));
    });

    it('removes field property from request payload', function () {
      editingInterfaces.save(contentType, {
        sys: {},
        widgets: [
          {fieldId: 'FIELD', field: {}}
        ]
      });
      var data = spaceEndpoint.args[0][0].data;
      expect(data.widgets[0].field).toBe(undefined);
    });

    it('removes empty widget parameters from request payload', function () {
      editingInterfaces.save(contentType, {
        sys: {},
        widgets: [
          {fieldId: 'FIELD', widgetParams: {}}
        ]
      });
      var data = spaceEndpoint.args[0][0].data;
      expect(data.widgets[0].widgetParams).toBe(undefined);
    });
  });
});
