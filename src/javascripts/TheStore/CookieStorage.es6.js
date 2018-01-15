import Cookies from 'Cookies';
import env from 'environment';

/*
  Provides methods for accessing cookie storage.
 */

const getBaseAttrs = () => ({ secure: env.env !== 'development' });

export const get = key => Cookies.get(key);

export const remove = key => Cookies.remove(key, getBaseAttrs());

export function set (key, value) {
  const attrs = _.extend({ expires: 365 }, getBaseAttrs());

  Cookies.set(key, value, attrs);
}

export const type = 'CookieStorage';
