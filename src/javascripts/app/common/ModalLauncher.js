import ReactDOM from 'react-dom';

export function open(componentRenderer) {
  let rootDom = null;

  const getRoot = () => {
    if (rootDom === null) {
      rootDom = document.createElement('div');
      rootDom.setAttribute('id', 'modals-root' + Date.now().toString());
      document.body.appendChild(rootDom);
    }
    return rootDom;
  };

  return new Promise(resolve => {
    let currentConfig = { onClose, isShown: true };

    function render({ onClose, isShown }) {
      ReactDOM.render(componentRenderer({ onClose, isShown }), getRoot());
    }

    function onClose(...args) {
      currentConfig = {
        ...currentConfig,
        isShown: false
      };
      render(currentConfig);
      resolve(...args);
      getRoot().remove();
    }

    render(currentConfig);
  });
}

export default {
  open
};
