import { convertInternalStateToConfiguration } from './SidebarSync.es6';
import { flatten, uniq } from 'lodash';
import { SidebarType } from '../constants.es6';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';
import { defaultWidgetsMap, EntryConfiguration } from '../defaults.es6';

function getAllKeys(arr) {
  return uniq(flatten(arr.map(item => Object.keys(item))));
}

describe('EntrySidebar/Configuration/SidebarSync.es6', () => {
  describe('convertInternalStateToConfiguration', () => {
    it('should be nullable if default config is selected', () => {
      expect(
        convertInternalStateToConfiguration({
          sidebarType: SidebarType.default,
          items: EntryConfiguration
        })
      ).toBeNull();
    });

    it('should return valid configuration with disabled defaults', () => {
      const items = [
        defaultWidgetsMap.Publication,
        defaultWidgetsMap.Versions,
        {
          widgetId: 'some-custom-extension',
          widgetNamespace: NAMESPACE_EXTENSION
        }
      ];
      const state = {
        sidebarType: SidebarType.custom,
        items
      };
      const configuration = convertInternalStateToConfiguration(state);
      expect(getAllKeys(configuration)).toEqual(['widgetId', 'widgetNamespace', 'disabled']);

      expect(configuration).toHaveLength(EntryConfiguration.length + 1);
      expect(configuration.filter(item => item.disabled)).toHaveLength(
        EntryConfiguration.length - 2
      );
    });
  });
});
