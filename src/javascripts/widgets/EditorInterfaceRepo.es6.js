import { fromAPI, toAPI } from './EditorInterfaceTransformer.es6';

export default function createEditorInterfaceRepo(cma) {
  return { get, save };

  async function get(ct, widgets) {
    const ei = await cma.getEditorInterface(ct.sys.id);

    return fromAPI(ct, ei, widgets);
  }

  async function save(ct, data, widgets) {
    const apiData = toAPI(ct, data, widgets);
    const ei = await cma.updateEditorInterface(apiData);

    return fromAPI(ct, ei, widgets);
  }
}
