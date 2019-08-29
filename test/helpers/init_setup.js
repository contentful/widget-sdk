beforeEach(async function() {
  const { angularInitRun } = await this.system.import('AngularInit');

  this.__originalInitRun = angularInitRun;
});

afterEach(function() {
  delete angular.module('contentful/init')._runBlocks[0];

  angular.module('contentful/init').run(this.__originalInitRun);
});
