const APPS_KEY = 'temp-apps-storage';

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(APPS_KEY));
  } catch (e) {
    return {};
  }
};

const writeStore = data => {
  try {
    localStorage.setItem(APPS_KEY, JSON.stringify(data));
  } catch (e) {
    throw e;
  }
};

const updateStore = data => {
  const existingData = readStore() || {};
  writeStore({
    ...existingData,
    ...data
  });
};

if (!readStore()) {
  writeStore({
    netlify: {
      id: 'netlify',
      title: 'Netlify',
      installed: true,
      config: {}
    },
    algolia: {
      id: 'algolia',
      title: 'Algolia',
      installed: false,
      config: {}
    },
    optimizely: {
      id: 'optimizely',
      title: 'Optimizely',
      installed: false,
      config: {}
    }
  });
}

const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

function createAppsClient() {
  const getAll = async () => {
    await delay(300);
    return Object.values(readStore() || {});
  };

  const get = async id => {
    await delay(300);
    const data = readStore() || {};
    const item = data[id];
    if (!item) {
      throw new Error('app does not exist');
    }
    return item;
  };

  const save = async (id, config) => {
    await delay(300);
    const item = await get(id);
    const updatedItem = {
      ...item,
      config: {
        ...item.config,
        ...config
      }
    };
    updateStore({
      [item.id]: updatedItem
    });
    return updatedItem;
  };

  const install = async id => {
    await delay(300);
    const item = await get(id);
    const updatedItem = {
      ...item,
      installed: true
    };
    updateStore({
      [item.id]: updatedItem
    });
    return updatedItem;
  };

  const uninstall = async id => {
    await delay(300);
    const item = await get(id);
    const updatedItem = {
      ...item,
      installed: false
    };
    updateStore({
      [item.id]: updatedItem
    });
    return updatedItem;
  };

  return { getAll, get, save, install, uninstall };
}

export default createAppsClient();
