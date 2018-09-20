import _ from 'lodash';
import * as Analytics from 'analytics/Analytics.es6';

const eventProperties = [
  'fullscreen',
  'newValue',
  'characterCountAfter',
  'characterCountBefore',
  'characterCountSelection'
];

export const trackMarkdownEditorAction = (action, { fullscreen, ...properties }) => {
  const hasInvalidProperties = _.some(
    Object.keys(properties),
    prop => !eventProperties.includes(prop)
  );
  if (hasInvalidProperties) {
    const validProps = eventProperties.join(', ');
    throw new RangeError(`Invalid markdown tracking property. Should be one of: ${validProps}`);
  }
  Analytics.track('markdown_editor:action', {
    action,
    fullscreen: !!fullscreen,
    ...properties
  });
};
