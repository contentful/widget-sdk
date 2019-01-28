import createEIRepo from './EditorInterfaceRepo.es6';

jest.mock('./DefaultWidget.es6', () => jest.fn(() => 'DEFAULT'));

describe('EditorInterfaceRepo', () => {
  let contentType;

  beforeEach(() => {
    contentType = {
      sys: {},
      fields: [{ apiName: 'FIELD' }]
    };
  });

  describe('#get()', () => {
    describe('with saved content type', () => {
      beforeEach(() => {
        contentType.sys.version = 1;
      });

      it('sends GET request to the editor interface endpoint for the content type', () => {
        const endpoint = jest.fn(() => Promise.resolve({}));
        const repo = createEIRepo(endpoint);

        contentType.sys.id = 'CTID';
        repo.get(contentType);

        expect(endpoint).toBeCalledWith({
          method: 'GET',
          path: ['content_types', 'CTID', 'editor_interface']
        });
      });

      it('returns internal representation of the editor interface with widgets', async () => {
        const res = { controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET' }] };
        const endpoint = jest.fn(() => Promise.resolve(res));
        const repo = createEIRepo(endpoint);

        const { controls } = await repo.get(contentType);

        expect(controls).toHaveLength(1);
        expect(controls[0]).toEqual({
          fieldId: 'FIELD',
          widgetId: 'WIDGET',
          field: { apiName: 'FIELD' }
        });
      });

      it('resolves with the default editor interface if a 404 is returned', async () => {
        const endpoint = jest.fn(() => Promise.reject({ status: 404 }));
        const repo = createEIRepo(endpoint);

        const { controls } = await repo.get(contentType);

        expect(controls).toHaveLength(1);
        expect(controls[0]).toEqual({
          fieldId: 'FIELD',
          widgetId: 'DEFAULT',
          field: { apiName: 'FIELD' }
        });
      });

      it('throws if the API responds with an error', async () => {
        const endpoint = jest.fn(() => Promise.reject({ status: 500 }));
        const repo = createEIRepo(endpoint);

        expect.assertions(1);
        try {
          await repo.get(contentType);
        } catch (err) {
          expect(err.status).toBe(500);
        }
      });
    });

    describe('when the content type is new', () => {
      beforeEach(() => {
        contentType.sys.version = 0;
      });

      it('does not send GET request', () => {
        const endpoint = jest.fn();
        const repo = createEIRepo(endpoint);

        repo.get(contentType);

        expect(endpoint).not.toBeCalled();
      });

      it('resolves with the default editor interface', async () => {
        const endpoint = jest.fn();
        const repo = createEIRepo(endpoint);

        const { controls } = await repo.get(contentType);

        expect(controls).toHaveLength(1);
        expect(controls[0]).toEqual({
          fieldId: 'FIELD',
          widgetId: 'DEFAULT',
          field: { apiName: 'FIELD' }
        });
      });
    });
  });

  describe('#save()', () => {
    beforeEach(() => {
      contentType.sys.id = 'CTID';
    });

    it('sends PUT request with version and payload properly structured', () => {
      const endpoint = jest.fn(() => Promise.resolve({}));
      const repo = createEIRepo(endpoint);

      repo.save(contentType, {
        sys: { version: 'V' },
        controls: [{ fieldId: 'FIELD', field: { id: 'FIELD' }, widgetId: 'WIDGET', settings: {} }]
      });

      expect(endpoint).toBeCalledWith({
        method: 'PUT',
        path: ['content_types', 'CTID', 'editor_interface'],
        version: 'V',
        data: {
          sys: { version: 'V' },
          controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET' }]
        }
      });
    });

    it('returns internal representation of the saved editor interface', async () => {
      const res = { controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET' }] };
      const endpoint = jest.fn(() => Promise.resolve(res));
      const repo = createEIRepo(endpoint);

      const { controls } = await repo.save(contentType, { sys: { version: 'V' } });

      expect(controls).toHaveLength(1);
      expect(controls[0]).toEqual({
        fieldId: 'FIELD',
        widgetId: 'WIDGET',
        field: { apiName: 'FIELD' }
      });
    });
  });
});
