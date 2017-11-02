'use strict';

describe('Video Search Controller', function () {
  let controller, searchObjectMock, searchObjectRunDeferred, scope;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($controller, $q, $rootScope) {
      searchObjectRunDeferred = $q.defer();
      searchObjectMock = jasmine.createSpyObj('searchObjectMock', ['run', 'isPaginable', 'nextPage']);
      searchObjectMock.run.and.returnValue(searchObjectRunDeferred.promise);
      searchObjectMock.nextPage.and.returnValue(searchObjectMock);

      scope = $rootScope.$new();
      scope.videoEditor = {
        searchConfig: {
          prepareSearch: jasmine.createSpy(),
          processSearchResults: jasmine.createSpy(),
          widgetPlayerDirective: 'some-directive',
          customAttrsForPlayer: 'some-custom-attrs'
        }
      };

      scope.videoEditor.searchConfig.prepareSearch.and.returnValue(searchObjectMock);

      controller = $controller('cfVideoSearchController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('when the search term changes', function () {
    describe('on every change', function () {
      beforeEach(function () {
        scope.videoSearch.searchTerm = '';
        scope.$apply();
      });

      it('resets the error message', function () {
        expect(scope.videoSearch.errorMessage).toBeUndefined();
      });

      it('sets the "searchFinished" flag to false', function () {
        expect(scope.videoSearch.searchFinished).toBeFalsy();
      });

      it('resets the videos list', function () {
        expect(scope.videoSearch.videos).toEqual([]);
      });
    });

    describe('when the search term is not empty', function () {
      beforeEach(function () {
        scope.videoSearch.searchTerm = 'kitty';
        scope.$apply();
      });

      it('sets the "isSearching" flag to true', function () {
        expect(scope.videoSearch.isSearching).toBeTruthy();
      });

      it('generates a new search object', function () {
        expect(scope.videoEditor.searchConfig.prepareSearch).toHaveBeenCalledWith('kitty');
      });

      it('executes the new search', function () {
        expect(searchObjectMock.run).toHaveBeenCalled();
      });

      describe('when the search succeeds', function () {
        beforeEach(function () {
          scope.videoSearch.videos = ['video'];
          scope.videoEditor.searchConfig.processSearchResults.and.returnValue(['processed-video']);
          searchObjectRunDeferred.resolve('search-results');
          scope.$apply();
        });

        it('sets the "isSearching" to false', function () {
          expect(scope.videoSearch.isSearching).toBeFalsy();
        });

        it('sets the "searchFinished" to true', function () {
          expect(scope.videoSearch.searchFinished).toBeTruthy();
        });

        describe('processes search results', function () {
          it('calls the #processSearchResults callback method passing the search results', function () {
            expect(scope.videoEditor.searchConfig.processSearchResults).toHaveBeenCalledWith('search-results');
          });

          it('concats the value returned from the #processSearchResults callback to the "videos" property', function () {
            expect(scope.videoSearch.videos).toEqual(['video', 'processed-video']);
          });
        });
      });

      describe('#loadMore', function () {
        beforeEach(function () {
          searchObjectMock.run.calls.reset();
        });

        describe('when the current search is not paginable', function () {
          beforeEach(function () {
            searchObjectMock.isPaginable.and.returnValue(false);
            controller.loadMore();
          });

          it('does not update the page index', function () {
            expect(searchObjectMock.nextPage).not.toHaveBeenCalled();
          });

          it('does not execute a new search', function () {
            expect(searchObjectMock.run).not.toHaveBeenCalled();
          });
        });

        describe('when the current search is paginable', function () {
          beforeEach(function () {
            scope.videoSearch.isSearching = false;
            searchObjectMock.isPaginable.and.returnValue(true);
            controller.loadMore();
          });

          it('sets the "isSearching" flag to true', function () {
            expect(scope.videoSearch.isSearching).toBeTruthy();
          });

          it('updates the page index', function () {
            expect(searchObjectMock.nextPage).toHaveBeenCalled();
          });

          it('executes a new search', function () {
            expect(searchObjectMock.run).toHaveBeenCalled();
          });
        });
      });

      describe('#selectVideo', function () {
        describe('when multiple selection is disabled', function () {
          beforeEach(function () {
            scope.videoEditor.searchConfig.isMultipleSelectionEnabled = false;
          });

          describe('when there is no previous selection', function () {
            beforeEach(function () {
              controller.selectVideo('video-1');
            });

            it('sets the video as the selection', function () {
              expect(scope.videoSearch.selection).toEqual(['video-1']);
            });
          });

          describe('when there is a previous selection', function () {
            beforeEach(function () {
              spyOn(scope, '$broadcast');
              scope.videoSearch.selection = ['video-1'];
              controller.selectVideo('video-2');
            });

            it('the selected video replaces the previous one', function () {
              expect(scope.videoSearch.selection).toEqual(['video-2']);
            });

            it('broadcasts the "video:selected" event', function () {
              expect(scope.$broadcast).toHaveBeenCalledWith('video:selected', {video: 'video-2'});
            });
          });
        });

        describe('when multiple selection is enabled', function () {
          beforeEach(function () {
            scope.videoEditor.searchConfig.isMultipleSelectionEnabled = true;
            scope.videoSearch.selection = ['video-1'];
            controller.selectVideo('video-2');
          });

          it('adds the video at the beginning of the current selection', function () {
            expect(scope.videoSearch.selection).toEqual(['video-2', 'video-1']);
          });
        });
      });

      describe('#deselectVideo', function () {
        beforeEach(function () {
          scope.videoSearch.selection = ['video-1', 'video-2'];
          controller.deselectVideo('video-2');
        });

        it('removes from the selection the passed in video', function () {
          expect(scope.videoSearch.selection).toEqual(['video-1']);
        });
      });

      describe('#getSelected', function () {
        let selection;
        beforeEach(function () {
          scope.videoSearch.selection = ['video-1'];
          selection = controller.getSelected();
        });

        it('returns the current selection', function () {
          expect(selection).toEqual(['video-1']);
        });
      });
    });
  });
});
