import {} from 'core/services/window';

export function hasEnvironmentSectionInUrl() {
  return window.location.pathname.includes('/environments/');
}
