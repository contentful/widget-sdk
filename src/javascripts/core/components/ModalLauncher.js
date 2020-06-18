import ReactDOM from 'react-dom';

/**
 * @param {function} componentRenderer
 * @param {object=} opts
 * @param {string} opts.modalId optional idempotency key to reuse a modal root
 * @param {string} opts.delay optional ms before removing the component from the tree defaults to 25ms.
 */
function open(componentRenderer, opts = {}) {
  opts = { delay: 300, ...opts };

  // Allow components to specify they wish to re-use the modal container
  const rootElId = `modals-root${opts.modalId || Date.now()}`;
  let rootDom = null;

  const getRoot = () => {
    if (rootDom !== null) {
      return rootDom;
    }

    // Re-use the container if we find it
    rootDom = document.getElementById(rootElId);
    if (rootDom !== null) {
      return rootDom;
    }

    // Otherwise create it
    rootDom = document.createElement('div');
    rootDom.setAttribute('id', rootElId);
    document.body.appendChild(rootDom);
    return rootDom;
  };

  return new Promise((resolve) => {
    let currentConfig = { onClose, isShown: true };

    function render({ onClose, isShown }) {
      ReactDOM.render(componentRenderer({ onClose, isShown }), getRoot());
    }

    async function onClose(...args) {
      currentConfig = {
        ...currentConfig,
        isShown: false,
      };
      render(currentConfig);
      await new Promise((resolveDelay) => setTimeout(resolveDelay, opts.delay));
      ReactDOM.unmountComponentAtNode(getRoot());
      getRoot().remove();
      resolve(...args);
    }

    render(currentConfig);
  });
}

export const ModalLauncher = {
  open,
};
