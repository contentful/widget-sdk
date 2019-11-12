import ReactDOM from 'react-dom';

let rootDom = null;

const getRoot = () => {
  if (rootDom === null) {
    rootDom = document.createElement('div');
    rootDom.setAttribute('id', 'modals-root');
    document.body.appendChild(rootDom);
  }
  return rootDom;
};

export function open(componentRenderer) {
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
    }

    render(currentConfig);
  });
}

export default {
  open
};
