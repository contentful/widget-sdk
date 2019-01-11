describe('data/ContentPreview', () => {
  beforeEach(function() {
    this.environment = {
      env: 'production',
      apiUrl: () => ''
    };
  });

  describe('#hasTEAContentPreviews', () => {
    beforeEach(function() {
      module('contentful/test', $provide => {
        $provide.value('Config.es6', this.environment);
      });
      this.hasTEAContentPreviews = function(...args) {
        const { hasTEAContentPreviews } = this.$inject('data/ContentPreview');
        return hasTEAContentPreviews(...args);
      };
    });
    it('should return false if there are no content previews', function() {
      expect(this.hasTEAContentPreviews()).toEqual(false);
      expect(this.hasTEAContentPreviews({})).toEqual(false);
    });
    it('should return false if no content previews use TEA suite', function() {
      expect(
        this.hasTEAContentPreviews({
          test: {
            configurations: [
              { url: 'https://google.com' },
              { url: 'http://the-example-app-nodejs.quirely.com' }
            ]
          }
        })
      ).toEqual(false);
    });
    it('should return true on prod if there is atleast one content preview that uses an example app from the TEA suite', function() {
      // default env is production as set in top level beforeEach
      expect(
        this.hasTEAContentPreviews({
          test: {
            configurations: [
              { url: 'https://google.com' },
              { url: 'http://the-example-app-nodejs.contentful.com' }
            ]
          }
        })
      ).toEqual(true);
    });
    it('should return true on staging if there is atleast one content preview that uses an example app from the TEA suite', function() {
      this.environment.env = 'staging';
      expect(
        this.hasTEAContentPreviews({
          test: {
            configurations: [
              { url: 'https://google.com' },
              { url: 'http://the-example-app-nodejs.flinkly.com' }
            ]
          }
        })
      ).toEqual(true);
    });
  });

  describe('#hasHighlightedCourseCT', () => {
    beforeEach(function() {
      module('contentful/test', $provide => {
        $provide.value('Config.es6', this.environment);
      });
      this.hasHighlightedCourseCT = function(...args) {
        const { hasHighlightedCourseCT } = this.$inject('data/ContentPreview');
        return hasHighlightedCourseCT(...args);
      };
    });
    it('should return false when there are no content types with id `layoutHighlightedCourse`', function() {
      expect(this.hasHighlightedCourseCT([])).toEqual(false);
      expect(
        this.hasHighlightedCourseCT([
          {
            sys: {
              id: 1
            }
          }
        ])
      ).toEqual(false);
    });
    it('should return true when there is a content type with the id `layoutHighlightedCourse`', function() {
      expect(
        this.hasHighlightedCourseCT([
          {
            sys: { id: 'layoutHighlightedCourse' }
          }
        ])
      ).toEqual(true);
    });
  });
});
