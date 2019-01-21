import * as validators from './validators.es6';

describe('validators', () => {
  describe('otherIdpName', () => {
    it('should accept a case insensitive alphanumeric string', () => {
      expect(validators.otherIdpName('Testing1234')).toBe(true);
    });

    it('should accept underscores', () => {
      expect(validators.otherIdpName('Testing_1234')).toBe(true);
    });

    it('should accept hyphens', () => {
      expect(validators.otherIdpName('Testing-1234')).toBe(true);
    });

    it('should accept spaces', () => {
      expect(validators.otherIdpName('Testing 1234')).toBe(true);
    });

    it('should reject for another case', () => {
      expect(validators.otherIdpName('Testing@1234')).toBe(false);
    });
  });

  describe('ssoName', () => {
    it('should accept a lowercase alphanumeric string', () => {
      expect(validators.ssoName('testing1234')).toBe(true);
      expect(validators.ssoName('Testing1234')).toBe(false);
    });

    it('should accept underscores', () => {
      expect(validators.ssoName('testing_1234')).toBe(true);
    });

    it('should accept hyphens', () => {
      expect(validators.ssoName('testing-1234')).toBe(true);
    });

    it('should accept spaces', () => {
      expect(validators.ssoName('testing 1234')).toBe(true);
    });

    it('should reject for another case', () => {
      expect(validators.ssoName('testing@1234')).toBe(false);
    });
  });

  describe('idpCert', () => {
    it('should accept a valid certificate', () => {
      const validCert = `
        -----BEGIN CERTIFICATE-----
        MIIEHTCCAwWgAwIBAgIURpeRQfkW81lZeIepYruVOSshzsgwDQYJKoZIhvcNAQEF
        BQAwWjELMAkGA1UEBhMCVVMxEzARBgNVBAoMCmNvbnRlbnRmdWwxFTATBgNVBAsM
        DE9uZUxvZ2luIElkUDEfMB0GA1UEAwwWT25lTG9naW4gQWNjb3VudCA4ODQzMDAe
        Fw0xNjA3MjYxMTQxMDRaFw0yMTA3MjcxMTQxMDRaMFoxCzAJBgNVBAYTAlVTMRMw
        EQYDVQQKDApjb250ZW50ZnVsMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxHzAdBgNV
        BAMMFk9uZUxvZ2luIEFjY291bnQgODg0MzAwggEiMA0GCSqGSIb3DQEBAQUAA4IB
        DwAwggEKAoIBAQDHWkufjcgXFo+rpRJdxe7Pp/5IfriNzccAjRNB8GRIlXN4Ehfc
        yDjBlAaIJgiocZeZbTYyOaiwL5L6Hzioo276I9oMPW4CT0ux/V40z58+SEU/Y/aI
        2CQHRPqaifLa7RlAcFOqs46YC11vaV2zPDYImYjKNy3ZamvtiGFst5OeeiGZ2H3N
        UFMz356IXDOlC753T0X4z1LFHhLLyWpP3T3ocvNkm1Gza0ykrh6X1rIjiV9e171j
        5FZSuTd8T54DRmBoLUJGAJf+IyA+lqjFYmBcdlqaHC0zndg9oEsq6/82heL+vENG
        vg8z0/Cs4UoxAypB01xcS/IPQP+Em37KO42bAgMBAAGjgdowgdcwDAYDVR0TAQH/
        BAIwADAdBgNVHQ4EFgQUl2Fz9TF2ANt6srDwHTNdqJLOKJ4wgZcGA1UdIwSBjzCB
        jIAUl2Fz9TF2ANt6srDwHTNdqJLOKJ6hXqRcMFoxCzAJBgNVBAYTAlVTMRMwEQYD
        VQQKDApjb250ZW50ZnVsMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxHzAdBgNVBAMM
        Fk9uZUxvZ2luIEFjY291bnQgODg0MzCCFEaXkUH5FvNZWXiHqWK7lTkrIc7IMA4G
        A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQUFAAOCAQEAjey9ORufCHQ0AdvDQxu9
        KZoYoRjZIqBcphMyAsTt8XOGuY9AcSmgwbUssuFem4fwILSH0YQiwg9B6t7e3Nx+
        HgkMcdVerr3wWGoeMR2p9OTI5fJRbtJP+yIEJS0RMF25R6SxQhAB45fVYcoNL5aN
        EuYz8C7zL8KjdkqRj9f1I0mfiWRW0OQNCYTpGNUQ44BDxOpZxr6eNqzwk43SZxlQ
        d4aZ54LwwS0HaS6adSOYAW5sNLRAmrBu2h91cIcyRMqY7PVF+2M9gFcWtIrmmy6T
        FWzDOWOGjyZkWsD3gAp4M0exSUBKpUwBPPT9W1bcMWrmERrDi/Rovy8Md4ma+zVd
        mg==
        -----END CERTIFICATE-----
      `;

      expect(validators.idpCert(validCert)).toBe(true);
    });

    it('should reject an invalid cert', () => {
      const invalidCert = `
        -----BEGIN CERTIFICATE-----
        MIIEHTCCAwWgAwIBAgIURpeRQfkW81lZeIepYruVOSshzsgwDQYJKoZIhvcNAQEF
        BQAwWjELMAkGA1UEBhMCVVMxEzARBgNVBAoMCmNvbnRlbnRmdWwxFTATBgNVBAsM
        DE9uZUxvZ2luIElkUDEfMB0GA1UEAwwWT25lTG9naW4gQWNjb3VudCA4ODQzMDAe
        Fw0xNjA3MjYxMTQxMDRaFw0yMTA3MjcxMTQxMDRaMFoxCzAJBgNVBAYTAlVTMRMw
        EQYDVQQKDApjb250ZW50ZnVsMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxHzAdBgNV
        BAMMFk9uZUxvZ2luIEFjY291bnQgODg0MzAwggEiMA0GCSqGSIb3DQEBAQUAA4IB
        DwAwggEKAoIBAQDHWkufjcgXFo+rpRJdxe7Pp/5IfriNzccAjRNB8GRIlXN4Ehfc
        yDjBlAaIJgiocZeZbTYyOaiwL5L6Hzioo276I9oMPW4CT0ux/V40z58+SEU/Y/aI
        2CQHRPqaifLa7RlAcFOqs46YC11vaV2zPDYImYjKNy3ZamvtiGFst5OeeiGZ2H3N
        UFMz356IXDOlC753T0X4z1LFHhLLyWpP3T3ocvNkm1Gza0ykrh6X1rIjiV9e171j
        5FZSuTd8T54DRmBoLUJGAJf+IyA+lqjFYmBcdlqaHC0zndg9oEsq6/82heL+vENG
        vg8z0/Cs4UoxAypB01xcS/IPQP+Em37KO42bAgMBAAGjgdowgdcwDAYDVR0TAQH/
        BAIwADAdBgNVHQ4EFgQUl2Fz9TF2ANt6srDwHTNdqJLOKJ4wgZcGA1UdIwSBjzCB
        jIAUl2Fz9TF2ANt6srDwHTNdqJLOKJ6hXqRcMFoxCzAJBgNVBAYTAlVTMRMwEQYD
        VQQKDApjb250ZW50ZnVsMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxHzAdBgNVBAMM
        Fk9uZUxvZ2luIEFjY291bnQgODg0MzCCFEaXkUH5FvNZWXiHqWK7lTkrIc7IMA4G
        A1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQUFAAOCAQEAjey9ORufCHQ0AdvDQxu9
        KZoYoRjZIqBcphMyAsTt8XOGuY9AcSmgwbUssuFem4fwILSH0YQiwg9B6t7e3Nx+
        HgkMcdVerr3wWGoeMR2p9OTI5fJRbtJP+yIEJS0RMF25R6SxQhAB45fVYcoNL5aN
        EuYz8C7zL8KjdkqRj9f1I0mfiWRW0OQNCYTpGNUQ44BDxOpZxr6eNqzwk43SZxlQ
        d4aZ54LwwS0HaS6adSOYAW5sNLRAmrBu2h91cIcyRMqY7PVF+2M9gFcWtIrmmy6T
        FWzDOWOGjyZkWsD3gAp4M0exSUBKpUwBPPT9W1bcMWrmERrDi/Rovy8Md4ma+z
        mg=
        -----END CERTIFICATE-----
      `;

      expect(validators.idpCert(invalidCert)).toBe(false);
    });
  });

  describe('idpSsoTargetUrl', () => {
    it('should accept an https url', () => {
      expect(validators.idpSsoTargetUrl('https://test.example.com/')).toBe(true);
      expect(validators.idpSsoTargetUrl('https://test.example.com/?provider=contentful')).toBe(
        true
      );
    });

    it('should reject a non-https or invalid url', () => {
      expect(validators.idpSsoTargetUrl('http://test.example.com/')).toBe(false);
      expect(validators.idpSsoTargetUrl('https://whatever')).toBe(false);
    });
  });
});
