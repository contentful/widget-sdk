import { get } from 'lodash';

export default extension => ({
  installationParams: get(extension, ['parameters', 'installation'], []).map(p => p.id),
  instanceParams: get(extension, ['parameters', 'instance'], []).map(p => p.id)
});
