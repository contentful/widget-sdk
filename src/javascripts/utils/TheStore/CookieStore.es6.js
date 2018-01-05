import Cookies from 'Cookies';
import env from 'environment';

const _getBaseAttrs = () => { return { secure: env.env !== 'development' }; };

export const get = key => Cookies.get(key);

export const remove = key => Cookies.remove(key, _getBaseAttrs());

export function set (key, value) {
  const attrs = _.extend({ expires: 365 }, _getBaseAttrs());

  Cookies.set(key, value, attrs);
}

export const type = 'CookieStore';
