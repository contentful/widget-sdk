import { cloneDeep, get } from 'lodash';

import * as NetlifyClient from './NetlifyClient.es6';

export async function install(config, appsClient, accessToken) {
  config = cloneDeep(config);

  const buildHookPromises = config.sites.map(siteConfig => {
    return NetlifyClient.createBuildHook(siteConfig.netlifySiteId, accessToken);
  });

  const buildHooks = await Promise.all(buildHookPromises);

  config.sites = config.sites.map((siteConfig, i) => {
    const hook = buildHooks[i];
    return { ...siteConfig, buildHookUrl: hook.url, buildHookId: hook.id };
  });

  await appsClient.save('netlify', config);

  return config;
}

export async function update(config, appsClient, accessToken) {
  config = cloneDeep(config);

  config.sites = config.sites.map(siteConfig => {
    siteConfig = { ...siteConfig };
    delete siteConfig.buildHookUrl;
    delete siteConfig.buildHookId;
    return siteConfig;
  });

  await removeExistingBuildHooks(appsClient, accessToken);

  return install(config, appsClient, accessToken);
}

export async function uninstall(appsClient, accessToken) {
  await removeExistingBuildHooks(appsClient, accessToken);

  return appsClient.remove('netlify');
}

async function removeExistingBuildHooks(appsClient, accessToken) {
  const remote = await appsClient.get('netlify');
  const siteConfigs = get(remote, ['config', 'sites'], []);

  const buildHookRemovalPromises = siteConfigs.map(siteConfig => {
    const { netlifySiteId, buildHookId } = siteConfig;
    if (netlifySiteId && buildHookId) {
      return NetlifyClient.deleteBuildHook(netlifySiteId, buildHookId, accessToken);
    } else {
      return Promise.resolve();
    }
  });

  try {
    await Promise.all(buildHookRemovalPromises);
  } catch (err) {
    // Failed removing some build hooks.
    // We can live with that.
  }
}
