import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import HomePage from 'app/home/EmptySpaceHome';

export default {
  name: 'home',
  url: '/',
  params: {
    orgId: null,
  },
  navComponent: EmptyNavigationBar,
  component: HomePage,
};
