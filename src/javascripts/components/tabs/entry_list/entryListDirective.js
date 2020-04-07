import { registerDirective } from 'NgRegistry';
import entryListTemplate from './entry_list.html';

export default function register() {
  registerDirective('cfEntryList', () => ({
    template: entryListTemplate,
    restrict: 'A',
    controller: 'EntryListController',
  }));
}
