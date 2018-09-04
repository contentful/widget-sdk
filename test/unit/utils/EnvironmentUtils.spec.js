import * as EnvironmentUtils from 'utils/EnvironmentUtils.es6';

describe('utils/EnvironmentUtils.es6', () => {
  beforeEach(function() {
    module('contentful/test');

    this.spaceContext = this.$inject('spaceContext');

    this.space = {
      environment: {
        sys: {
          id: 'master'
        }
      }
    };

    this.spaceContext.space = this.space;

    this.setEnvironment = id => {
      this.space.environment = {
        sys: {
          id
        }
      };
    };
  });

  describe('#isInsideMasterEnv', () => {
    it('should return true if inside master environment', function() {
      const flag = EnvironmentUtils.isInsideMasterEnv(this.spaceContext);

      expect(flag).toBe(true);
    });

    it('should return false if not inside master environment', function() {
      this.setEnvironment('dev');

      const flag = EnvironmentUtils.isInsideMasterEnv(this.spaceContext);

      expect(flag).toBe(false);
    });
  });
});
