import { AccountMenu, NavBar, SidePanel } from './elements';

export abstract class AbstractPage {
  get navBar() {
    return new NavBar();
  }

  get accountMenu() {
    return new AccountMenu();
  }

  get sidePanel() {
    return new SidePanel();
  }
}
