import * as Navigator from 'states/Navigator';

type Route = { name: string; url: string };

export function mapRoutes(routes: Record<string, Route>) {
  return Object.keys(routes).map((key) => ({ name: routes[key].name, url: routes[key].url }));
}

export function navigateToRoute(route) {
  return Navigator.go({ path: `^.${route}` });
}
