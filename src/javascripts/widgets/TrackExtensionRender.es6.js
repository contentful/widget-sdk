import { get } from 'lodash';
import * as Analytics from 'analytics/Analytics.es6';

import { EXPECTED_EVENT_PROPS } from 'analytics/snowplow/transformers/ExtensionRender.es6';

export default function trackExtensionRender(location, extensionEntity, parameters = {}) {
  const { extension } = extensionEntity;
  const data = assertEventProps({
    location,
    extension_id: extensionEntity.sys.id,
    extension_definition_id: get(extensionEntity, ['extensionDefinition', 'sys', 'id'], null),
    extension_name: extension.name,
    src: typeof extension.src === 'string' ? extension.src : null,
    installation_params: Object.keys(get(parameters, ['installation'], {})),
    instance_params: Object.keys(get(parameters, ['instance'], {}))
  });

  Analytics.track('extension:render', data);
}

export function makeEventFromWidget(location, widget) {
  return assertEventProps({
    location,
    extension_id: get(widget, ['descriptor', 'id']),
    extension_definition_id: get(widget, ['descriptor', 'extensionDefinitionId'], null),
    extension_name: get(widget, ['descriptor', 'name']),
    src: typeof widget.src === 'string' ? widget.src : null,
    installation_params: Object.keys(get(widget, ['parameters', 'installation'], {})),
    instance_params: Object.keys(get(widget, ['parameters', 'instance'], {}))
  });
}

// Keep both Segment and Snowplow payloads in sync.
function assertEventProps(data) {
  const actual = Object.keys(data)
    .sort()
    .join(',');
  const expected = EXPECTED_EVENT_PROPS.slice()
    .sort()
    .join(',');

  if (actual === expected) {
    return data;
  } else {
    throw new Error(`You need to provide ${EXPECTED_EVENT_PROPS.join(', ')}.`);
  }
}
