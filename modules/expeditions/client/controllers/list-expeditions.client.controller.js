(function () {
  'use strict';

  angular
    .module('expeditions')
    .controller('ExpeditionsListController', ExpeditionsListController);

  ExpeditionsListController.$inject = ['moment', 'lodash', 'Authentication', 'ExpeditionsService', 'TeamsService'];

  function ExpeditionsListController(moment, lodash, Authentication, ExpeditionsService, TeamsService) {
    var vm = this;
    vm.user = Authentication.user;

    var checkRole = function(role) {
      var teamLeadIndex = lodash.findIndex(vm.user.roles, function(o) {
        return o === role;
      });
      return (teamLeadIndex > -1) ? true : false;
    };

    vm.isTeamLead = checkRole('team lead');
    vm.isTeamMember = checkRole('team member');
    vm.isTeamLeadPending = checkRole('team lead pending');
    vm.isTeamMemberPending = checkRole('team member pending') || checkRole('partner');
    vm.isAdmin = checkRole('admin');

    var byOwner, byMember;
    if (vm.isTeamLead || vm.isTeamLeadPending) {
      byOwner = true;
    } else {
      byMember = true;
    }

    ExpeditionsService.query({
      byOwner: byOwner,
      byMember: byMember,
    }, function(data) {
      vm.expeditions = data;
    });

    TeamsService.query({
      byOwner: true
    }, function(data) {
      vm.teams = data;
    });

    vm.expeditionLink = function(expedition) {
      return ((vm.isTeamLead || vm.isAdmin) && (expedition.status === 'incomplete' || expedition.status === 'returned' ||
        expedition.status === 'unpublished')) ?
      'expeditions.view({ expeditionId: expedition._id })' :
      'expeditions.protocols({ expeditionId: expedition._id })';
    };

    vm.isUpcoming = function(expedition) {
      return (moment(expedition.monitoringStartDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').isAfter(moment())) ? true : false;
    };

    vm.getExpeditionDate = function(expedition) {
      return moment(expedition.monitoringStartDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('MMMM D, YYYY');
    };

    vm.getExpeditionTimeRange = function(expedition) {
      return moment(expedition.monitoringStartDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('HH:mm')+'-'+
        moment(expedition.monitoringEndDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('HH:mm');
    };

    vm.checkWrite = function(teamList) {
      if (checkRole('team lead') || checkRole('admin')) {
        return true;
      } else {
        var teamListIndex = lodash.findIndex(teamList, function(m) {
          return m.username === vm.user.username;
        });
        return (teamListIndex > -1) ? true : false;
      }
    };

    vm.checkStatusIncomplete = function(expedition) {
      var protocolsComplete = true;
      if (vm.checkWrite(expedition.teamLists.siteCondition) && expedition.protocols.siteCondition.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.oysterMeasurement) && expedition.protocols.oysterMeasurement.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.mobileTrap) && expedition.protocols.mobileTrap.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.settlementTiles) && expedition.protocols.settlementTiles.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.waterQuality) && expedition.protocols.waterQuality.status === 'incomplete') protocolsComplete = false;
      return expedition.status === 'incomplete' && !protocolsComplete;
    };

    vm.checkStatusPending = function(expedition) {
      var protocolsComplete = true;
      if (vm.checkWrite(expedition.teamLists.siteCondition) && expedition.protocols.siteCondition.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.oysterMeasurement) && expedition.protocols.oysterMeasurement.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.mobileTrap) && expedition.protocols.mobileTrap.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.settlementTiles) && expedition.protocols.settlementTiles.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.waterQuality) && expedition.protocols.waterQuality.status === 'incomplete') protocolsComplete = false;
      return expedition.status === 'pending' || (protocolsComplete && expedition.status !== 'published');
    };

    vm.checkStatusReturned = function(expedition) {
      var protocolsComplete = true;
      if (vm.checkWrite(expedition.teamLists.siteCondition) && expedition.protocols.siteCondition.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.oysterMeasurement) && expedition.protocols.oysterMeasurement.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.mobileTrap) && expedition.protocols.mobileTrap.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.settlementTiles) && expedition.protocols.settlementTiles.status === 'incomplete') protocolsComplete = false;
      if (vm.checkWrite(expedition.teamLists.waterQuality) && expedition.protocols.waterQuality.status === 'incomplete') protocolsComplete = false;
      return expedition.status === 'returned' && !protocolsComplete;
    };

    vm.displayAssignedProtocols = function(expedition) {
      var assigned = [];
      if (vm.checkWrite(expedition.teamLists.siteCondition)) assigned.push('1');
      if (vm.checkWrite(expedition.teamLists.oysterMeasurement)) assigned.push('2');
      if (vm.checkWrite(expedition.teamLists.mobileTrap)) assigned.push('3');
      if (vm.checkWrite(expedition.teamLists.settlementTiles)) assigned.push('4');
      if (vm.checkWrite(expedition.teamLists.waterQuality)) assigned.push('5');
      var formatted = (assigned.length === 1) ? 'Protocol ' : 'Protocols ';
      for (var i = 0; i < assigned.length; i++) {
        formatted += assigned[i];
        if (i === assigned.length - 2 && assigned.length > 1) {
          formatted += ' & ';
        } else if (i < assigned.length - 1 && assigned.length > 1) {
          formatted += ', ';
        }
      }
      return formatted;
    };
  }
})();
