import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfSelectAllInput', () => ({
    restrict: 'A',

    link: function(_scope, el) {
      el.css('cursor', 'pointer');
      el.on('click', selectAll);

      function selectAll() {
        const end = el.val().length;
        el.textrange('set', 0, end);
      }
    }
  }));
}
