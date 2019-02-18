import asn1 from '@jo-sm/asn1js';

export function idpName(value) {
  return /^[A-Za-z0-9 \-_]+$/.test(value);
}

export function ssoName(value) {
  return /^[a-z0-9 \-_]+$/.test(value);
}

export function idpCert(value) {
  if (value === '') {
    return true;
  }

  try {
    asn1.decode(value);

    return true;
  } catch (e) {
    return false;
  }
}

export function idpSsoTargetUrl(value) {
  if (value === '') {
    return true;
  }

  // Taken from https://stackoverflow.com/a/3809435
  const httpsUrlRegex = /https:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/;

  return httpsUrlRegex.test(value);
}
