import { syncControls, fromAPI, toAPI } from './EditorInterfaceTransformer.es6';

const makePath = ct => ['content_types', ct.sys.id, 'editor_interface'];

export default function createEditorInterfaceRepo(spaceEndpoint, getWidgets) {
  return { get, save };

  // Given a content type, fetch and return internal
  // representation of its editor interface.
  async function get(ct) {
    // We may pass both draft and published content types.
    // We need to check for revision too!
    if (!ct.sys.revision && !ct.sys.version) {
      return makeDefault(ct);
    }

    try {
      const ei = await spaceEndpoint({ method: 'GET', path: makePath(ct) });
      return fromAPI(ct, ei, getWidgets());
    } catch (err) {
      if (err && err.status === 404) {
        return makeDefault(ct);
      } else {
        throw err;
      }
    }
  }

  function makeDefault(ct) {
    return {
      sys: {},
      controls: syncControls(ct, [], getWidgets())
    };
  }

  async function save(ct, data) {
    const widgets = getWidgets();

    const ei = await spaceEndpoint({
      method: 'PUT',
      path: makePath(ct),
      version: data.sys.version,
      data: toAPI(ct, data, widgets)
    });

    return fromAPI(ct, ei, widgets);
  }
}
