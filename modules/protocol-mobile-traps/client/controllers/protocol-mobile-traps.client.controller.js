(function () {
  'use strict';

  angular
    .module('protocol-mobile-traps')
    .controller('ProtocolMobileTrapsController', ProtocolMobileTrapsController);

  ProtocolMobileTrapsController.$inject = ['$scope', '$rootScope', '$state', 'moment', '$http', '$stateParams', '$timeout',
    'lodash', 'Authentication', 'FileUploader', 'ProtocolMobileTrapsService', 'MobileOrganismsService', 'TeamMembersService'];

  function ProtocolMobileTrapsController($scope, $rootScope, $state, moment, $http, $stateParams, $timeout,
    lodash, Authentication, FileUploader, ProtocolMobileTrapsService, MobileOrganismsService, TeamMembersService) {
    var mt = this;

    // Set up Organisms
    mt.filter = {
      category: ''
    };

    mt.clearFilters = function() {
      mt.filter = {
        category: ''
      };
      mt.findOrganisms();
    };

    mt.clickFilter = function(category) {
      mt.filter = {
        category: category
      };
      mt.findOrganisms();
    };

    mt.findOrganisms = function(callback) {
      MobileOrganismsService.query({
        category: mt.filter.category
      }, function(data) {
        mt.mobileOrganisms = data;
        $rootScope.$broadcast('iso-method', { name:null, params:null });
        $timeout(function() {
          $rootScope.$broadcast('iso-method', { name:null, params:null });
        });
        if (callback) callback();
      });
    };

    mt.getFoundOrganism = function(organism) {
      if (!mt.foundOrganisms[organism._id]) {
        mt.foundOrganisms[organism._id] = {
          uploader: new FileUploader({ alias: 'newSketchPhotoPicture' }),
          count: 0,
          imageUrl: '',
          notes: '',
          organism: organism
        };
      }
      return mt.foundOrganisms[organism._id];
    };

    var setupMobileOrganisms = function() {
      for (var i = 0; i < mt.protocolMobileTrap.mobileOrganisms.length; i++) {
        var organismDetails = mt.protocolMobileTrap.mobileOrganisms[i];
        var organismId = (organismDetails.organism && organismDetails.organism._id) ?
          organismDetails.organism._id : organismDetails.organism;
        if (!mt.foundOrganisms[organismId]) {
          mt.foundOrganisms[organismId] = {
            uploader: new FileUploader({ alias: 'newSketchPhotoPicture' }),
            count: 0,
            imageUrl: '',
            notes: '',
            organism: organismDetails.organism
          };
        }

        mt.foundOrganisms[organismId].count = organismDetails.count;
        mt.foundOrganisms[organismId].imageUrl = (organismDetails.sketchPhoto) ? organismDetails.sketchPhoto.path : '';
        mt.foundOrganisms[organismId].notes = organismDetails.notesQuestions;
      }
    };

    mt.foundOrganisms = {};
    mt.mobileOrganisms = mt.findOrganisms(function() {
      for (var o = 0; o < mt.mobileOrganisms.length; o++) {
        mt.getFoundOrganism(mt.mobileOrganisms[o]);
      }

      // Set up Protocol Mobile Traps
      mt.protocolMobileTrap = {};
      if ($stateParams.protocolMobileTrapId) {
        ProtocolMobileTrapsService.get({
          mobileTrapId: $stateParams.protocolMobileTrapId
        }, function(data) {
          mt.protocolMobileTrap = data;
          mt.protocolMobileTrap.collectionTime = moment(mt.protocolMobileTrap.collectionTime).startOf('minute').toDate();
          setupMobileOrganisms();
          $scope.protocolMobileTrap = mt.protocolMobileTrap;
        });
      } else if ($scope.protocolMobileTrap) {
        mt.protocolMobileTrap = new ProtocolMobileTrapsService($scope.protocolMobileTrap);
        mt.protocolMobileTrap.collectionTime = moment(mt.protocolMobileTrap.collectionTime).startOf('minute').toDate();
        if (!mt.protocolMobileTrap.mobileOrganisms) {
          mt.protocolMobileTrap.mobileOrganisms = [];
        } else {
          setupMobileOrganisms();
        }
        $scope.protocolMobileTrap = mt.protocolMobileTrap;
      } else {
        mt.protocolMobileTrap = new ProtocolMobileTrapsService();
        mt.protocolMobileTrap.mobileOrganisms = [];
        $scope.protocolMobileTrap = mt.protocolMobileTrap;
      }
    });

    mt.authentication = Authentication;
    mt.error = null;
    mt.form = {};

    mt.teamMemberSelectConfig = {
      mode: 'tags-id',
      id: '_id',
      text: 'displayName',
      textLookup: function(id) {
        return TeamMembersService.get({ memberId: id }).$promise;
      },
      options: function(searchText) {
        return TeamMembersService.query();
      }
    };

    mt.dateTime = {
      min: moment().subtract(7, 'days').toDate(),
      max: moment().add(1, 'year').toDate()
    };

    // // Remove existing protocol mobile trap
    // mt.remove = function() {
    //   if (confirm('Are you sure you want to delete?')) {
    //     mt.protocolMobileTrap.$remove($state.go('protocol-mobile-traps.main'));
    //   }
    // };

    var foundOrganismsToMobileOrganisms = function(imageErrorMessage) {
      var foundIds = [];
      mt.protocolMobileTrap.mobileOrganisms = [];
      for (var foundId in mt.foundOrganisms) {
        var found = mt.foundOrganisms[foundId];
        foundIds.push(foundId);
        if (found.count > 0) {
          mt.protocolMobileTrap.mobileOrganisms.push({
            organism: found.organism,
            count: found.count,
            notesQuestions: found.notes,
            sketchPhoto: {
              path: found.imageUrl
            }
          });
          if (!found.imageUrl || found.imageUrl === '') {
            imageErrorMessage = 'Image missing for mobile trap';
          }
        }
      }
      return foundIds;
    };

    // $scope.$on('saveMobileTrap', function() {
    //   mt.form.mobileTrapForm.$setSubmitted(true);
    //   mt.save(mt.form.mobileTrapForm.$valid);
    // });

    // // Save protocol mobile trap
    // mt.save = function(isValid) {
    //   if (!isValid) {
    //     $scope.$broadcast('show-errors-check-validity', 'mt.form.mobileTrapForm');
    //     $rootScope.$broadcast('saveMobileTrapError');
    //     return false;
    //   }
    //
    //   var imageErrorMessage = '';
    //   var foundIds = foundOrganismsToMobileOrganisms(imageErrorMessage);
    //
    //   if (imageErrorMessage !== '') {
    //     mt.error = imageErrorMessage;
    //     return false;
    //   }
    //
    //   if (mt.protocolMobileTrap.mobileOrganisms.length <= 0) {
    //     mt.error = 'At least one mobile organism is required';
    //     $rootScope.$broadcast('saveMobileTrapError');
    //     return false;
    //   }
    //
    //   // TODO: move create/update logic to service
    //   if (mt.protocolMobileTrap._id) {
    //     mt.protocolMobileTrap.$update(successCallback, errorCallback);
    //   } else {
    //     mt.protocolMobileTrap.$save(successCallback, errorCallback);
    //   }
    //
    //   function successCallback(res) {
    //     var mobileTrapId = res._id;
    //
    //     function uploadAllSketchPhotos(mobileTrapId, foundIds, sketchPhotosSuccessCallback, sketchPhotosErrorCallback) {
    //       function uploadSketchPhoto(mobileTrapId, index, foundIds, sketchPhotoSuccessCallback, sketchPhotoErrorCallback) {
    //         if (index < foundIds.length && foundIds[index]) {
    //           var organismId = foundIds[index];
    //           var uploader = mt.foundOrganisms[organismId].uploader;
    //           if (uploader.queue.length > 0) {
    //             uploader.onSuccessItem = function (fileItem, response, status, headers) {
    //               uploadSketchPhoto(mobileTrapId, index+1, foundIds, sketchPhotoSuccessCallback, sketchPhotoErrorCallback);
    //             };
    //
    //             uploader.onErrorItem = function (fileItem, response, status, headers) {
    //               mt.protocolMobileTrap.mobileOrganisms[index].sketchPhoto.error = response.message;
    //               sketchPhotoErrorCallback(organismId);
    //             };
    //
    //             uploader.onBeforeUploadItem = function(item) {
    //               item.url = 'api/protocol-mobile-traps/' + mobileTrapId + '/organisms/' + organismId + '/upload-sketch-photo';
    //             };
    //             uploader.uploadAll();
    //           } else {
    //             uploadSketchPhoto(mobileTrapId, index+1, foundIds, sketchPhotoSuccessCallback, sketchPhotoErrorCallback);
    //           }
    //         } else {
    //           sketchPhotoSuccessCallback();
    //         }
    //       }
    //
    //       uploadSketchPhoto(mobileTrapId, 0, foundIds, function() {
    //         sketchPhotosSuccessCallback();
    //       }, function(organismId) {
    //         sketchPhotosErrorCallback('Error uploading sketch or photo for organism id ' + organismId);
    //       });
    //     }
    //
    //     uploadAllSketchPhotos(mobileTrapId, foundIds, function() {
    //       $rootScope.$broadcast('saveMobileTrapSuccessful');
    //     }, function(errorMessage) {
    //       delete mt.protocolMobileTrap._id;
    //       mt.error = errorMessage;
    //       $rootScope.$broadcast('saveMobileTrapError');
    //       return false;
    //     });
    //   }
    //
    //   function errorCallback(res) {
    //     mt.error = res.data.message;
    //     $rootScope.$broadcast('saveMobileTrapError');
    //   }
    // };
    //
    // mt.cancel = function() {
    //   $state.go('protocol-mobile-traps.main');
    // };

    mt.addOrganism = function(organism) {
      var organismDetails = mt.getFoundOrganism(organism);
      organismDetails.count = organismDetails.count+1;

      mt.foundOrganisms[organism._id] = organismDetails;
    };

    mt.removeOrganism = function(organism) {
      var organismDetails = mt.getFoundOrganism(organism);
      organismDetails.count = organismDetails.count-1;
      if (organismDetails.count < 0) organismDetails.count = 0;

      mt.foundOrganisms[organism._id] = organismDetails;
    };

    mt.openOrganismDetails = function(organism) {
      $rootScope.$broadcast('stopSaving');
      var content = angular.element('#modal-organism-details-'+organism._id);

      mt.organismDetails = mt.getFoundOrganism(organism);
      mt.sketchPhotoUrl = (mt.organismDetails.imageUrl) ? mt.organismDetails.imageUrl : '';

      content.modal('show');
    };

    var saveImageOnBlur = function(organismId, successCallback, errorCallback) {
      if (mt.protocolMobileTrap._id && mt.foundOrganisms[organismId].imageUrl !== '') {
        if (organismId) {
          var uploader = mt.foundOrganisms[organismId].uploader;
          if (uploader.queue.length > 0) {
            uploader.onSuccessItem = function (fileItem, response, status, headers) {
              uploader.removeFromQueue(fileItem);
              ProtocolMobileTrapsService.get({
                mobileTrapId: mt.protocolMobileTrap._id
              }, function(data) {
                mt.protocolMobileTrap = lodash.merge(mt.protocolMobileTrap, data);
                mt.protocolMobileTrap.collectionTime = moment(mt.protocolMobileTrap.collectionTime).startOf('minute').toDate();
                setupMobileOrganisms();
                $rootScope.$broadcast('savingStop');
                $scope.protocolMobileTrap = mt.protocolMobileTrap;
                successCallback();
              });
            };

            uploader.onErrorItem = function (fileItem, response, status, headers) {
              $rootScope.$broadcast('savingStop');
              errorCallback(response.message);
            };

            uploader.onBeforeUploadItem = function(item) {
              item.url = 'api/protocol-mobile-traps/' + mt.protocolMobileTrap._id + '/organisms/' + organismId + '/upload-sketch-photo';
            };
            $rootScope.$broadcast('savingStart');
            uploader.uploadAll();
          } else {
            successCallback();
          }
        } else {
          errorCallback('Error with organism id');
        }
      } else if (mt.protocolMobileTrap._id && mt.foundOrganisms[organismId].imageUrl === '') {
        mt.saveOnBlur();
      }
    };

    mt.saveOrganismDetails = function(organismDetails, organismId, isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'form.organismDetailsForm');
        return false;
      } else {
        $rootScope.$broadcast('savingStart');
        angular.element('#modal-organism-details-'+organismId).modal('hide');
        mt.foundOrganisms[organismDetails.organism._id] = organismDetails;

        var imageErrorMessage = '';
        var foundIds = foundOrganismsToMobileOrganisms(imageErrorMessage);

        mt.saveOnBlur(function(successful) {
          saveImageOnBlur(organismId, function() {
            mt.organismDetails = {};
            mt.sketchPhotoUrl = '';
            $rootScope.$broadcast('savingStop');
            if (successful) $rootScope.$broadcast('incrementalSaveMobileTrapSuccessful');
          }, function(errorMessage) {
            mt.error = errorMessage;
            $rootScope.$broadcast('savingStop');
          });
        }, function(errorMessage) {
          mt.error = errorMessage;
          $rootScope.$broadcast('savingStop');
        });
      }
    };

    mt.cancelOrganismDetails = function(organismId) {
      angular.element('#modal-organism-details-'+organismId).modal('hide');
      mt.organismDetails = {};
      mt.sketchPhotoUrl = '';
      $rootScope.$broadcast('startSaving');
    };

    $scope.$on('incrementalSaveMobileTrap', function() {
      mt.saveOnBlur();
    });

    mt.saveOnBlur = function(successCallback, errorCallback) {
      setupMobileOrganisms();
      foundOrganismsToMobileOrganisms();

      if (mt.protocolMobileTrap._id && ((mt.form.mobileTrapForm.$touched && mt.form.mobileTrapForm.$dirty) ||
        (mt.protocolMobileTrap.mobileOrganisms && mt.protocolMobileTrap.mobileOrganisms.length > 0))) {
        $rootScope.$broadcast('savingStart');
        $http.post('/api/protocol-mobile-traps/' + mt.protocolMobileTrap._id + '/incremental-save',
        mt.protocolMobileTrap)
        .success(function (data, status, headers, config) {
          mt.protocolMobileTrap = lodash.merge(mt.protocolMobileTrap, new ProtocolMobileTrapsService(data.mobileTrap));
          mt.protocolMobileTrap.collectionTime = moment(mt.protocolMobileTrap.collectionTime).startOf('minute').toDate();
          setupMobileOrganisms();
          if (data.errors) {
            mt.error = data.errors;
            if (errorCallback) {
              errorCallback(data.errors);
            } else {
              mt.form.mobileTrapForm.$setSubmitted(true);
              $rootScope.$broadcast('incrementalSaveMobileTrapError');
            }
          }
          if (data.successful) {
            mt.error = null;
            if (successCallback) {
              successCallback(data.successful);
            } else {
              $rootScope.$broadcast('incrementalSaveMobileTrapSuccessful');
            }
          }
          $scope.protocolMobileTrap = mt.protocolMobileTrap;
          $rootScope.$broadcast('savingStop');
        })
        .error(function (data, status, headers, config) {
          mt.error = data.message;
          mt.form.mobileTrapForm.$setSubmitted(true);
          $rootScope.$broadcast('incrementalSaveMobileTrapError');
          $rootScope.$broadcast('savingStop');
          if (errorCallback) errorCallback(data.message);
        });
      } else {
        $rootScope.$broadcast('savingStop');
      }
    };

    $timeout(function() {
      $rootScope.$broadcast('iso-method', { name:null, params:null });
      mt.saveOnBlur();
      $rootScope.$broadcast('startSaving');
    }, 1000);

    mt.openMap = function() {
      $rootScope.$broadcast('stopSaving');
    };

    mt.closeMap = function() {
      $rootScope.$broadcast('startSaving');
    };
  }
})();
