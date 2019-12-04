import { get } from 'lodash';
import * as Analytics from 'analytics/Analytics';

export default function trackExtensionRender(location, widget) {
  const data = makeEventFromWidget(location, widget);

  Analytics.track('extension:render', data);
}

export function makeEventFromWidget(location, widget) {
  return {
    location,
    extension_id: get(widget, ['descriptor', 'id']),
    // TODO: rename property in v2 of the schema.
    extension_definition_id: get(widget, ['descriptor', 'appDefinitionId'], null),
    extension_name: get(widget, ['descriptor', 'name']),
    src: typeof widget.src === 'string' ? widget.src : null,
    installation_params: Object.keys(get(widget, ['parameters', 'installation'], {})),
    instance_params: Object.keys(get(widget, ['parameters', 'instance'], {}))
  };
}
