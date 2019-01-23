import { cloneDeep, get, uniqBy } from 'lodash';
import { getPostPublishUrl } from './BuildButton/PubNubClient.es6';
import * as NetlifyClient from './NetlifyClient.es6';
import { getModule } from 'NgRegistry.es6';

const contentPreview = getModule('contentPreview');
const spaceContext = getModule('spaceContext');

const ARTIFACT_KEYS = ['buildHookUrl', 'buildHookId', 'contentPreviewId'];
const NETLIFY_HOOK_EVENTS = ['deploy_building', 'deploy_created', 'deploy_failed'];

export async function install({ config, contentTypeIds, appsClient, accessToken }) {
  config = prepareConfig(config);

  // Create build hooks for all sites.
  const buildHookPromises = config.sites.map(siteConfig => {
    return NetlifyClient.createBuildHook(siteConfig.netlifySiteId, accessToken);
  });

  const buildHooks = await Promise.all(buildHookPromises);

  // Merge build hook details to configurations.
  config.sites = config.sites.map((siteConfig, i) => {
    const hook = buildHooks[i];
    return {
      ...siteConfig,
      buildHookUrl: hook.url,
      buildHookId: hook.id,
      channel: `contentful-netlify-app-${config.installationId}-${siteConfig.netlifySiteId}`
    };
  });

  // Create Netlify notification hooks for all sites.
  const netlifyHookPromises = uniqBy(config.sites, s => s.netlifySiteId).reduce((
    acc,
    siteConfig
  ) => {
    const url = getPostPublishUrl(siteConfig.channel);
    const promisesForSite = NETLIFY_HOOK_EVENTS.map(event => {
      return NetlifyClient.createNotificationHook(siteConfig.netlifySiteId, accessToken, {
        event,
        url
      });
    });

    return acc.concat([Promise.all(promisesForSite)]);
  }, []);

  const netlifyHooks = await Promise.all(netlifyHookPromises);

  // Merge flattened notification hook IDs to configuration.
  config.netlifyHookIds = netlifyHooks.reduce((acc, hooksForSite) => {
    return acc.concat(hooksForSite.map(h => h.id));
  }, []);

  // Create content previews for all sites.
  const contentPreviewPromises = config.sites.map(siteConfig => {
    return contentPreview.create({
      name: `${siteConfig.name} (Netlify app)`,
      description: `Created by the Netlify app. Previews "${
        siteConfig.netlifySiteName
      }" Netlify site.`,
      configs: contentTypeIds.map(ctId => {
        return { contentType: ctId, enabled: true, url: siteConfig.netlifySiteUrl };
      })
    });
  });

  const contentPreviews = await Promise.all(contentPreviewPromises);

  // Merge content preview IDs to configurations.
  config.sites = config.sites.map((siteConfig, i) => {
    const contentPreview = contentPreviews[i];
    return { ...siteConfig, contentPreviewId: contentPreview.sys.id };
  });

  // Save configuration and return updated config.
  await appsClient.save('netlify', config);

  spaceContext.netlifyAppConfig.invalidate();

  return config;
}

export async function update(context) {
  const config = prepareConfig(context.config);

  // Remove existing build hooks and content previews.
  await removeExistingArtifacts(context.appsClient, context.accessToken);

  // Remove references to removed artifacts from configuration.
  config.sites = config.sites.map(siteConfig => {
    return Object.keys(siteConfig)
      .filter(key => !ARTIFACT_KEYS.includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: siteConfig[key] }), {});
  });

  delete config.netlifyHookIds;

  // Proceed as in the installation step.
  return install({ ...context, config });
}

export async function uninstall({ appsClient, accessToken }) {
  await removeExistingArtifacts(appsClient, accessToken);

  await appsClient.remove('netlify');

  spaceContext.netlifyAppConfig.invalidate();
}

function prepareConfig(config) {
  config = cloneDeep(config);
  config.sites = config.sites.map(siteConfig => {
    return { ...siteConfig, name: (siteConfig.name || '').trim() };
  });

  validateSiteConfigs(config.sites);

  return config;
}

function validateSiteConfigs(siteConfigs) {
  // At least one site needs to be configured.
  if (siteConfigs.length < 1) {
    throw makeError('Provide at least one site configuration.');
  }

  // Find all site configurations with incomplete information.
  const incomplete = siteConfigs.filter(siteConfig => {
    return !siteConfig.netlifySiteId || siteConfig.name.length < 1;
  });

  if (incomplete.length > 0) {
    throw makeError('Pick a Netlify site and provide a name for all configurations.');
  }

  // Display names must be unique.
  const uniqueNames = uniqBy(siteConfigs, config => config.name);

  if (uniqueNames.length !== siteConfigs.length) {
    throw makeError('Display names must be unique.');
  }
}

function makeError(message) {
  const err = new Error(message);
  err.useMessage = true;
  return err;
}

async function removeExistingArtifacts(appsClient, accessToken) {
  // Fetch the current remote version of configuration and...
  const remote = await appsClient.get('netlify');
  const siteConfigs = get(remote, ['config', 'sites'], []);
  const netlifyHookIds = get(remote, ['config', 'netlifyHookIds'], []);

  // ...remove build hooks for it and...
  const buildHookRemovalPromises = siteConfigs.map(siteConfig => {
    const { netlifySiteId, buildHookId } = siteConfig;
    if (netlifySiteId && buildHookId) {
      return NetlifyClient.deleteBuildHook(netlifySiteId, buildHookId, accessToken);
    } else {
      return Promise.resolve();
    }
  });

  // ...remove Netlify hooks for it and...
  let netlifyHookRemovalPromises = Promise.resolve();

  if (Array.isArray(netlifyHookIds)) {
    const validNetlifyHookIds = netlifyHookIds.filter(id => {
      return typeof id === 'string' && id.length > 0;
    });

    netlifyHookRemovalPromises = Promise.all(
      validNetlifyHookIds.map(id => NetlifyClient.deleteNotificationHook(id, accessToken))
    );
  }

  // ...remove content previews for it.
  const contentPreviewRemovalPromises = siteConfigs.map(siteConfig => {
    if (siteConfig.contentPreviewId) {
      return contentPreview.remove({ id: siteConfig.contentPreviewId });
    } else {
      return Promise.resolve();
    }
  });

  const removalPromises = buildHookRemovalPromises
    .concat(contentPreviewRemovalPromises)
    .concat(netlifyHookRemovalPromises);

  try {
    await Promise.all(removalPromises);
  } catch (err) {
    // Failed removing some build hooks or content previews.
    // We can live with that.
  }
}
