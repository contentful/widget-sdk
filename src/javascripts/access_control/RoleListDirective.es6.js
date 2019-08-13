import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfRoleList', () => ({
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  }));
}
