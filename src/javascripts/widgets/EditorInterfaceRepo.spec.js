import createEditorInterfaceRepo from './EditorInterfaceRepo.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

jest.mock('./DefaultWidget.es6', () => jest.fn(() => 'DEFAULT'));

describe('EditorInterfaceRepo', () => {
  const makeCt = ({ id, version } = {}) => {
    return {
      sys: { id, version },
      fields: [{ apiName: 'FIELD' }]
    };
  };

  describe('#get()', () => {
    describe('with saved content type', () => {
      it('sends GET request to the editor interface endpoint for the content type', () => {
        const endpoint = jest.fn(() => Promise.resolve({}));
        const repo = createEditorInterfaceRepo(endpoint);

        repo.get(makeCt({ id: 'CTID', version: 1 }));

        expect(endpoint).toBeCalledWith({
          method: 'GET',
          path: ['content_types', 'CTID', 'editor_interface']
        });
      });

      it('returns internal representation of the editor interface with widgets', async () => {
        const res = { controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET' }] };
        const endpoint = jest.fn(() => Promise.resolve(res));
        const repo = createEditorInterfaceRepo(endpoint);

        const { controls } = await repo.get(makeCt({ version: 1 }));

        expect(controls).toHaveLength(1);
        expect(controls[0]).toEqual({
          fieldId: 'FIELD',
          widgetId: 'WIDGET',
          widgetNamespace: NAMESPACE_BUILTIN,
          field: { apiName: 'FIELD' }
        });
      });

      it('sets "extension" widget namespace for UI Extensions when namespace is missing', async () => {
        const res = { controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET' }] };
        const endpoint = jest.fn(() => Promise.resolve(res));
        const repo = createEditorInterfaceRepo(endpoint);
        const widgets = {
          extension: [{ id: 'WIDGET' }],
          builtin: [{ id: 'WIDGET' }]
        };

        const { controls } = await repo.get(makeCt({ version: 1 }), widgets);

        expect(controls).toHaveLength(1);
        expect(controls[0].widgetNamespace).toEqual(NAMESPACE_EXTENSION);
      });

      it('uses API defined widget namespace', async () => {
        const res = {
          controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET', widgetNamespace: 'test' }]
        };
        const endpoint = jest.fn(() => Promise.resolve(res));
        const repo = createEditorInterfaceRepo(endpoint);

        const { controls } = await repo.get(makeCt({ version: 1 }));

        expect(controls).toHaveLength(1);
        expect(controls[0].widgetNamespace).toEqual('test');
      });

      it('resolves with the default editor interface if a 404 is returned', async () => {
        const endpoint = jest.fn(() => Promise.reject({ status: 404 }));
        const repo = createEditorInterfaceRepo(endpoint);

        const { controls } = await repo.get(makeCt({ version: 1 }));

        expect(controls).toHaveLength(1);
        expect(controls[0]).toEqual({
          fieldId: 'FIELD',
          widgetId: 'DEFAULT',
          widgetNamespace: NAMESPACE_BUILTIN,
          field: { apiName: 'FIELD' }
        });
      });

      it('throws if the API responds with an error', async () => {
        const endpoint = jest.fn(() => Promise.reject({ status: 500 }));
        const repo = createEditorInterfaceRepo(endpoint);

        expect.assertions(1);
        try {
          await repo.get(makeCt({ version: 1 }));
        } catch (err) {
          expect(err.status).toBe(500);
        }
      });
    });

    describe('when the content type is new', () => {
      it('does not send GET request', () => {
        const endpoint = jest.fn();
        const repo = createEditorInterfaceRepo(makeCt());

        repo.get(makeCt());

        expect(endpoint).not.toBeCalled();
      });

      it('resolves with the default editor interface', async () => {
        const endpoint = jest.fn();
        const repo = createEditorInterfaceRepo(endpoint);

        const { controls } = await repo.get(makeCt());

        expect(controls).toHaveLength(1);
        expect(controls[0]).toEqual({
          fieldId: 'FIELD',
          widgetId: 'DEFAULT',
          widgetNamespace: NAMESPACE_BUILTIN,
          field: { apiName: 'FIELD' }
        });
      });
    });
  });

  describe('#save()', () => {
    it('sends PUT request with version and payload properly structured', () => {
      const endpoint = jest.fn(() => Promise.resolve({}));
      const repo = createEditorInterfaceRepo(endpoint);

      repo.save(makeCt({ id: 'CTID' }), {
        sys: { version: 'V' },
        controls: [{ fieldId: 'FIELD', field: { id: 'FIELD' }, widgetId: 'WIDGET', settings: {} }]
      });

      expect(endpoint).toBeCalledWith({
        method: 'PUT',
        path: ['content_types', 'CTID', 'editor_interface'],
        version: 'V',
        data: {
          sys: { version: 'V' },
          controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET', widgetNamespace: NAMESPACE_BUILTIN }]
        }
      });
    });

    it('returns internal representation of the saved editor interface', async () => {
      const res = { controls: [{ fieldId: 'FIELD', widgetId: 'WIDGET' }] };
      const endpoint = jest.fn(() => Promise.resolve(res));
      const repo = createEditorInterfaceRepo(endpoint);

      const { controls } = await repo.save(makeCt({ id: 'CTID' }), { sys: { version: 'V' } });

      expect(controls).toHaveLength(1);
      expect(controls[0]).toEqual({
        fieldId: 'FIELD',
        widgetId: 'WIDGET',
        widgetNamespace: NAMESPACE_BUILTIN,
        field: { apiName: 'FIELD' }
      });
    });
  });
});
