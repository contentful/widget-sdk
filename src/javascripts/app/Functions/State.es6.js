import createBackend from './Backend.es6';

const detail = {
  name: 'detail',
  url: '/:fnId',
  template: '<react-component name="app/Functions/FunctionEditor.es6" props="props"/>',
  resolve: {
    fn: ['$stateParams', 'backend', ({ fnId }, backend) => backend.get(fnId)]
  },
  controller: [
    '$scope',
    'backend',
    'fn',
    ($scope, backend, fn) => {
      $scope.props = { backend, fn };
    }
  ]
};

const list = {
  name: 'functions',
  url: '/functions',
  template: '<react-component name="app/Functions/FunctionList.es6" props="props"/>',
  resolve: {
    backend: ['spaceContext', spaceContext => createBackend(spaceContext.getId())],
    fns: ['backend', backend => backend.list().then(res => res.items)]
  },
  controller: [
    '$scope',
    'backend',
    'fns',
    ($scope, backend, fns) => {
      $scope.props = { backend, fns };
    }
  ],
  children: [detail]
};

export default list;
