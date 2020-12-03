import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { EmptyHome } from './EmptyHome';

// This routing declaration refers to the "root" home, rather than the space home.
export const homeState = {
  name: 'home',
  url: '/',
  params: {
    orgId: null,
  },
  navComponent: EmptyNavigationBar,
  component: EmptyHome,
};
