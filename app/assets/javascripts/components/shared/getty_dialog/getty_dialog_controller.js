'use strict';

angular.module('contentful').controller('GettyDialogController',
    function($scope, gettyImagesFactory, PromisedLoader, Paginator, fileSize, stringUtils, sentry) {

  var IMAGES_PER_PAGE = 6;

  var entryLoader = new PromisedLoader();

  $scope.paginator = new Paginator();
  $scope.paginator.pageLength = IMAGES_PER_PAGE;

  function makeFileNameRe() {
    return (/\/([\d|\w|-]*.(\w{3}))\?/g);
  }

  var gettyImages = gettyImagesFactory($scope.spaceContext.space);

  $scope.getty = {
    families: {
      creative: false,
      editorial: false
    },
    licensing: {},
    creative: {},
    offerings: {},
    editorial: ''
  };

  $scope.imageFamilies = [];
  $scope.selectedSizeKey = '';

  $scope.$watch('getty.search', function (search) {
    if(!_.isEmpty(search)){
      $scope.gettyLoading = true;
      $scope.imageResults = null;
      searchForImages($scope.getty).then(saveResults, handleSearchFail);
    }
  });

  function searchForImages (params, offset) {
    var searchParams = {
      Filter: {
        FileTypes: ['jpg'],
        ProductOfferings: objectToArray(params.offerings),
        ImageFamilies: objectToArray(params.families),
        LicensingModels: objectToArrayIf(params.families.creative, params.licensing),
        GraphicStyles: objectToArrayIf(params.families.creative, params.graphicsStyle)
      },
      ResultOptions: {
        ItemCount: IMAGES_PER_PAGE,
        ItemStartNumber: offset+1 || 0
      },
      Query: {
        SearchPhrase: params.search
      }
    };

    if(params.editorial)
      searchParams.Filter.EditorialSegments = [ stringUtils.capitalize(params.editorial) ];
    if(params.excludeNudity)
      searchParams.Filter.ExcludeNudity = true;
    if(params.vectorIllustrations)
      searchParams.Filter.FileTypes.push('eps');
    if(params.sorting) {
      if(params.families.editorial && !params.families.creative)
        searchParams.ResultOptions.EditorialSortOrder = params.sorting;
      if(!params.families.editorial && params.families.creative)
        searchParams.ResultOptions.CreativeSortOrder = params.sorting;
    }

    return gettyImages.searchForImages(searchParams);
  }

  function handleSearchFail(error) {
    unknownError('Failure on Getty Images API Request', error);
  }

  function saveResults(res) {
    $scope.gettyLoading = false;
    var itemCount = getItemCount(res);
    if(!itemCount) return;
    $scope.paginator.numEntries = itemCount;
    $scope.hasBlendedSortOrder = !!getPath(res, 'data.result.BlendedSortOrder');
    $scope.currentSortOrder = getPath(res, 'data.result.CreativeSortOrder') || getPath(res, 'data.result.EditorialSortOrder');

    $scope.imageResults = prepareImageObjects(parseImagesResult(res));
  }

  function getItemCount(res) {
    var itemCount = getPath(res, 'data.result.ItemTotalCount');
    if(itemCount === 0)
      noResultsFound();
    else if(!itemCount)
      unknownError('Failure getting item count', res.data);
    return itemCount;
  }

  function parseImagesResult(res) {
    var images = getPath(res, 'data.result.Images');
    if(images && images.length > 0)
      return images;
    else if(images && images.length === 0){
      noResultsFound();
      return images;
    } else {
      unknownError('Failure getting images', res.data);
      return [];
    }
  }

  function objectToArrayIf(condition, obj) {
    return condition ? objectToArray(obj) : [];
  }

  function objectToArray(obj) {
    return _.reduce(obj, pushExistingKey, []);
  }

  function pushExistingKey(res, val, key) {
    if(val) res.push(stringUtils.capitalize(key));
    return res;
  }

  $scope.productOfferings = function (key) {
    return {
      EasyAccess: 'Easy Access'
    }[key];
  };

  $scope.licensingModel = function (key) {
    return {
      RoyaltyFree: 'Royalty Free',
      RightsManaged: 'Rights Managed'
    }[key];
  };

  function augmentImageAsFile (image, srcAttr, baseDimSize) {
    image = _.clone(image);
    var fileName = makeFileNameRe().exec(image[srcAttr]);
    if(fileName){
      image.fileName = fileName[1];
      image.url = image[srcAttr];
      image.external = true;
      image.baseDimSize = baseDimSize;
      image.details = {
        image: calculateDimensions(image, baseDimSize)
      };
    }
    return image;
  }

  function prepareImageObjects (images) {
    return _.map(images, function (image) {
      return {
        id: image.ImageId,
        preview: augmentImageAsFile(image, 'UrlPreview', 340),
        thumb: augmentImageAsFile(image, 'UrlThumb', 170)
      };
    });
  }

  function calculateDimensions(file, baseDimSize) {
    var sourceDims = {
      width: parseInt(file.MaxImageResolutionWidth, 10),
      height: parseInt(file.MaxImageResolutionHeight, 10)
    };

    var baseDim = sourceDims.width >= sourceDims.height ? 'width' : 'height';
    var relativeDim = sourceDims.width < sourceDims.height ? 'width' : 'height';
    var dims = {};
    dims[baseDim] = baseDimSize;
    var ratio = (dims[baseDim]*100)/sourceDims[baseDim];
    dims[relativeDim] = Math.ceil(sourceDims[relativeDim]*(ratio*0.01));
    return dims;
  }

  $scope.loadMore = function() {
    resetErrors();
    if ($scope.paginator.atLast() ||
        $scope.imageResults.length === 0 ||
        $scope.imageDetail
       ) return;
    $scope.paginator.page++;
    entryLoader.loadPromise(
      searchForImages, $scope.getty, $scope.paginator.skipItems()
    )
    .then(function (res) {
      var itemCount = getItemCount(res);
      if(!itemCount) return;
      $scope.paginator.numEntries = itemCount;
      var images = _.difference(
        prepareImageObjects(parseImagesResult(res)),
        $scope.imageResults
      );
      $scope.imageResults.push.apply($scope.imageResults, images);
    }, function () {
      $scope.paginator.page--;
    });
  };

  $scope.sortBy = function (sorting) {
    $scope.getty.sorting = sorting == 'default' ? null : sorting;
    searchForImages($scope.getty).then(saveResults);
  };

  $scope.showImageDetail = function (image) {
    $scope.gettyLoading = true;
    gettyImages.getImageDetails({
      ImageIds: [image.ImageId]
    }).then(function (res) {
      $scope.gettyLoading = false;
      var images = parseImagesResult(res);
      var imageDetail = images[0];
      imageDetail.SizesDownloadableImages = _.sortBy(imageDetail.SizesDownloadableImages, 'FileSizeInBytes');
      $scope.imageDetail = imageDetail;
    }, function (err) {
      unknownError('Failure getting image details', err);
    });
  };

  $scope.resetImageView = function () {
    $scope.imageDetail = null;
    $scope.selectedSizeKey = '';
  };

  $scope.fileSize = function (value) {
    return fileSize(value, {fixed: 0}).human({jedec: true});
  };

  $scope.selectSize = function (key) {
    $scope.selectedSizeKey = key;
  };

  $scope.isSortingActive = function () {
    return !$scope.hasBlendedSortOrder && (
             ($scope.getty.families.editorial && !$scope.getty.families.creative) ||
             (!$scope.getty.families.editorial && $scope.getty.families.creative)
           );
  };

  $scope.addImage = function () {
    $scope.gettyDownloading = true;
    gettyImages.getImageDownload($scope.imageDetail.ImageId, $scope.selectedSizeKey)
    .then(function (res) {
      $scope.gettyDownloading = false;
      var downloadUrls = getPath(res, 'data.result.DownloadUrls');
      if(downloadUrls && downloadUrls.length > 0 && downloadUrls[0].Status.toLowerCase() == 'success'){
        $scope.$emit('gettyFileAuthorized', {
          url: downloadUrls[0].UrlAttachment,
          filename: stringUtils.titleToFileName($scope.imageDetail.Title, '_')+'.jpg',
          mimetype: 'image/jpeg'
        });
        $scope.dialog.cancel();
      } else {
        noDownloadsAvailable();
      }
    }, function (err) {
      $scope.gettyDownloading = false;
      unknownError('Failure getting image download', err);
    });
  };

  function resetErrors() {
    $scope.searchError = null;
    $scope.downloadsError = null;
    $scope.noResults = false;
  }

  function noResultsFound() {
    $scope.noResults = true;
  }

  function unknownError(message, data) {
    $scope.gettyLoading = false;
    sentry.captureError(message, {
      data: data
    });
    $scope.searchError = 'An error occured and we have been notified. Please try again and contact us if the problem persists.';
  }

  function noDownloadsAvailable() {
    $scope.downloadsError = 'No downloads are available for this image';
  }

  function getPath(obj, path) {
    var segment;
    path = path.split('.');
    while(segment = path.shift()){
      if(!_.isUndefined(obj[segment])) obj = obj[segment];
      else return;
    }
    return obj;
  }

});
