import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { EmptyHome } from './EmptyHome';

export const homeState = {
  name: 'home',
  url: '/',
  params: {
    orgId: null,
  },
  navComponent: EmptyNavigationBar,
  component: EmptyHome,
};
