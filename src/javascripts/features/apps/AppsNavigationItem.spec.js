import {
  buildChildren,
  EXPLORE_APPS_TITLE,
  LOADING_TITLE,
  MANAGE_APPS_TITLE,
} from './AppsNavigationItem';
import { WidgetLocation } from '@contentful/widget-renderer';

describe('AppsNavigationItem', () => {
  describe('building children', () => {
    const appWithoutNavItem = {
      locations: [{ location: WidgetLocation.ENTRY_SIDEBAR }],
    };
    const appWithNavItem = {
      locations: [
        { location: WidgetLocation.ENTRY_SIDEBAR },
        {
          location: WidgetLocation.PAGE,
          navigationItem: {
            name: 'my app',
            path: '/',
          },
        },
      ],
    };

    it('adds "explore apps" child for non-admins', () => {
      const [link] = buildChildren(null, { canManageSpace: false });

      expect(link.title).toEqual(EXPLORE_APPS_TITLE);
    });

    it('adds "manage apps" child for admins', () => {
      const [link] = buildChildren(null, { canManageSpace: true });

      expect(link.title).toEqual(MANAGE_APPS_TITLE);
    });

    it('adds loading child if apps=nil', () => {
      const [, , loading] = buildChildren(null, {});

      expect(loading.title).toEqual(LOADING_TITLE);
    });

    it('adds promotion child if no apps installed', () => {
      const [, , promotion] = buildChildren([], { canManageSpace: true });

      expect(promotion.label).toEqual('apps-promotion');
    });

    it('adds promotion child if no apps with navigation item installed', () => {
      const [, , promotion] = buildChildren([appWithoutNavItem], { canManageSpace: true });

      expect(promotion.label).toEqual('apps-promotion');
    });

    it('adds child per app that has a navigation item', () => {
      const apps = [appWithNavItem, appWithNavItem];
      const [, , ...children] = buildChildren(apps, {});

      expect(children).toBeArrayOfSize(apps.length);
    });

    it('uses name as child title', () => {
      const [, , { title }] = buildChildren([appWithNavItem], {});

      expect(title).toEqual(appWithNavItem.locations[1].navigationItem.name);
    });

    it('uses path as routing info', () => {
      const [
        ,
        ,
        {
          srefParams: { path },
        },
      ] = buildChildren([appWithNavItem], {});

      expect(path).toEqual(appWithNavItem.locations[1].navigationItem.path);
    });
  });
});
