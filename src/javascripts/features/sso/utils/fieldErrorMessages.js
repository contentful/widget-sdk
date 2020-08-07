export function ssoName(viaApi = false) {
  if (!viaApi) {
    return 'Sign-in name format is not correct. Letters, numbers, periods, hyphens, and underscores are allowed.';
  } else {
    return 'This sign-in name is taken';
  }
}

export function idpCert() {
  return 'X.509 certificate format is not correct';
}

export function idpSsoTargetUrl() {
  return 'URL is not valid';
}
