import { get } from 'lodash';
import * as Analytics from 'analytics/Analytics';
import { LegacyWidget } from './WidgetCompat';

export default function trackExtensionRender(
  location: string,
  widget: LegacyWidget,
  environmentId: string
) {
  const data = makeEventFromWidget(location, { descriptor: widget }, environmentId);

  Analytics.track('extension:render', data);
}

export function makeEventFromWidget(
  location: string,
  widget: { descriptor: LegacyWidget },
  environmentId: string
) {
  return {
    location,
    extension_id: get(widget, ['descriptor', 'id']),
    // TODO: rename property in v2 of the schema.
    extension_definition_id: get(widget, ['descriptor', 'appDefinitionId'], null),
    extension_name: get(widget, ['descriptor', 'name']),
    src: get(widget, ['descriptor', 'src'], null),
    installation_params: Object.keys(get(widget, ['parameters', 'installation'], {})),
    instance_params: Object.keys(get(widget, ['parameters', 'instance'], {})),
    environment_id: environmentId,
  };
}
