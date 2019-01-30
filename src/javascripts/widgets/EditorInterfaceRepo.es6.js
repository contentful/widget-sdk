import { syncControls, fromAPI, toAPI } from './EditorInterfaceTransformer.es6';

const makeDefault = ct => ({ sys: {}, controls: syncControls(ct, []) });
const makePath = ct => ['content_types', ct.sys.id, 'editor_interface'];

export default function createEditorInterfaceRepo(spaceEndpoint) {
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
      return fromAPI(ct, ei);
    } catch (err) {
      if (err && err.status === 404) {
        return makeDefault(ct);
      } else {
        throw err;
      }
    }
  }

  async function save(ct, data) {
    const ei = await spaceEndpoint({
      method: 'PUT',
      path: makePath(ct),
      version: data.sys.version,
      data: toAPI(ct, data)
    });

    return fromAPI(ct, ei);
  }
}
