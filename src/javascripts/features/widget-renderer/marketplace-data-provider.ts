import { WidgetNamespace } from './interfaces';
import { NAMESPACE_APP, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';

export default class MarketplaceDataProvider {
  private cache: any = null;

  public async prefetch(): Promise<void> {
    if (!this.cache) {
      this.cache = await Promise.resolve({}); // TODO
    }
  }

  getSlug(widgetNamespace: WidgetNamespace, widgetId: string): string {
    if (widgetNamespace === NAMESPACE_APP) {
      //  TODO LOOKUP and return if found
    }
    return widgetId;
  }

  getIconUrl(widgetNamespace: WidgetNamespace, _widgetId: string): string {
    if (widgetNamespace === NAMESPACE_EXTENSION) {
      return 'default-extension-icon'; // TODO
    } else if (widgetNamespace === NAMESPACE_APP) {
      //  TODO LOOKUP and return if found
    }
    return 'default-or-unknown-icon';
  }
}
