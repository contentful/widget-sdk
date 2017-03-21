describe('cfDeveloperResources directive', function () {
  beforeEach(function () {
    module('contentful/test');

    const element = this.$compile('<cf-developer-resources />', {
      context: {}
    });
    this.controller = element.isolateScope().languageResources;
    this.$inject('$rootScope').$digest();
    this.controller.selectLanguage(this.controller.languageData[0]);
  });

  it('shows selected language', function () {
    this.controller.selectedLanguage.name = 'Javascript';
  });
});
