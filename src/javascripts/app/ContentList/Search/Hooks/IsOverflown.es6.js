import { makeHook } from 'ui/Framework/Hooks';

export const IsOverflownY = makeHook((el) => {
  if (el) {
    if (el.scrollHeight > el.clientHeight) {
      el.classList.add('is-overflown-y');
    } else {
      el.classList.remove('is-overflown-y');
    }
  }
});
