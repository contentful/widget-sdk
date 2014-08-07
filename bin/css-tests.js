'use strict';

// init WebdriverJS
var client = require('webdriverjs').remote({desiredCapabilities:{browserName: 'chrome'}});
// init WebdriverCSS
require('webdrivercss').init(client, {
  misMatchTolerance: 0,
  screenshotRoot: 'webdrivercss',
  api: 'http://localhost:9000/api/repositories/'
});

client.fullPageScreenshot = function (id, path) {
  return this
    .url('http://app.joistio.com:8888/'+path)
    .webdrivercss(id, {timeout: 3000, screenWidth: [1600]});
};

client
  .init()
  .sync()

  .url('http://be.joistio.com:8888/login')
  .waitFor('#login-form', 1000)
  .addValue('#user_email', 'user@example.com')
  .addValue('#user_password', 'password')
  .buttonClick('#login-form input[type="submit"]')

  .fullPageScreenshot('main', '')
  .fullPageScreenshot('content_type_list', 'spaces/a44t2my4kpo8/content_types')
  .fullPageScreenshot('content_type_editor', 'spaces/a44t2my4kpo8/content_types/artist')
  .fullPageScreenshot('entry_list', 'spaces/a44t2my4kpo8/entries')
  .fullPageScreenshot('entry_editor', 'spaces/a44t2my4kpo8/entries/2f4f5d16-7102-4110-97fd-f5c365d6bb26')
  .fullPageScreenshot('asset_list', 'spaces/a44t2my4kpo8/assets')
  .fullPageScreenshot('asset_editor', 'spaces/a44t2my4kpo8/assets/4LOlIBzEacwmYEkCa2SyeA')
  .fullPageScreenshot('api', 'spaces/a44t2my4kpo8/api')
  .fullPageScreenshot('api_list', 'spaces/a44t2my4kpo8/api_keys')
  .fullPageScreenshot('api_editor', 'spaces/a44t2my4kpo8/api_keys/5Ca8K9CcxFuuckZxjf3lxs')
  .fullPageScreenshot('space_settings', 'spaces/a44t2my4kpo8/settings/edit')

  .sync()
  .end();
