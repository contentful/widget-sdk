import { syncControls, fromAPI, toAPI } from './EditorInterfaceTransformer.es6';

const makePath = ct => ['content_types', ct.sys.id, 'editor_interface'];

export default function createEditorInterfaceRepo(spaceEndpoint) {
  return { get, save };

  // Given a content type, fetch and return internal
  // representation of its editor interface.
  async function get(ct, widgets) {
    // We may pass both draft and published content types.
    // We need to check for revision too!
    if (!ct.sys.revision && !ct.sys.version) {
      return makeDefault(ct, widgets);
    }

    try {
      const ei = await spaceEndpoint({ method: 'GET', path: makePath(ct) });
      return fromAPI(ct, ei, widgets);
    } catch (err) {
      if (err && err.status === 404) {
        return makeDefault(ct, widgets);
      } else {
        throw err;
      }
    }
  }

  function makeDefault(ct, widgets) {
    return {
      sys: {},
      controls: syncControls(ct, [], widgets)
    };
  }

  async function save(ct, data, widgets) {
    const ei = await spaceEndpoint({
      method: 'PUT',
      path: makePath(ct),
      version: data.sys.version,
      data: toAPI(ct, data, widgets)
    });

    return fromAPI(ct, ei, widgets);
  }
}
