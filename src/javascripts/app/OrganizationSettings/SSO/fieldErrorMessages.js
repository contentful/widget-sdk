export function ssoName({ api: viaApi } = {}) {
  if (!viaApi) {
    return new Error(
      'Sign-in name format is not correct. Letters, numbers, periods, hyphens, and underscores are allowed.'
    );
  } else {
    return new Error('This sign-in name is taken');
  }
}

export function idpCert() {
  return new Error('X.509 certificate format is not correct');
}

export function idpSsoTargetUrl() {
  return new Error('URL is not valid');
}
