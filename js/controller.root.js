'use strict';
angular.module('todo.controller.root', [])
.controller("SampleCtrl", function($scope, $rootScope, $ionicModal) {

	$scope.f = {
		search : ''
	};
	
	// Create and load the Modal
	$ionicModal.fromTemplateUrl('templates/new-message.html', function(modal) {
		$rootScope.taskModal = modal;
	}, {
		scope: $rootScope,
		animation: 'slide-in-up'
	});
	$rootScope.newTask = function() {
		$scope.taskModal.show();
		$rootScope.shownModal = $scope.taskModal;
	};
	// Close the new task modal
	$rootScope.closeNewTask = function() {
		$scope.taskModal.hide();
		$rootScope.shownModal = null;
	};
	//Cleanup the modal when we're done with it!
	$rootScope.$on('$destroy', function() {
		$scope.modal.remove();
	});
	// Execute action on hide modal
	$rootScope.$on('taskModal.hidden', function() {
		// Execute action
		$rootScope.shownModal = null;
	});
	// Execute action on remove modal
	$rootScope.$on('modal.removed', function() {
		// Execute action
	});
	
	
	// Create and load the Modal
	$ionicModal.fromTemplateUrl('templates/new-comment.html', function(modal) {
		$rootScope.commentModal = modal;
	}, {
		scope: $rootScope,
		animation: 'slide-in-up'
	});
	$rootScope.newComment = function() {
		$scope.commentModal.show();
		$rootScope.shownModal = $scope.commentModal;
	};
	// Close the new task modal
	$rootScope.closeNewComment = function() {
		$scope.commentModal.hide();
		$rootScope.shownModal = null;
	};
	//Cleanup the modal when we're done with it!
	$rootScope.$on('$destroy', function() {
		$scope.modal.remove();
	});
	// Execute action on hide modal
	$rootScope.$on('commentModal.hidden', function() {
		// Execute action
		$rootScope.shownModal = null;
	});
	// Execute action on remove modal
	$rootScope.$on('modal.removed', function() {
		// Execute action
	});
	
	

	//add friend modal
	$scope.newFriend = function() {
		// Create and load add friend modal
		$ionicModal.fromTemplateUrl('templates/new-friend.html', function(friendModal) {
			$rootScope.friendModal = friendModal;
			$rootScope.friendModal.show();
			$rootScope.shownModal = $rootScope.friendModal;
		}, {
			scope: $scope,
			animation: 'slide-in-up'
		});
	};
	//Cleanup the modal when we're done with it!
	$scope.$on('$destroy', function() {
		$rootScope.friendModal.remove();
		forge.logging.info("destory friend modal");
	});
	// Execute action on hide modal
	$scope.$on('friendModal.hidden', function() {
		// Execute action
		forge.logging.info("hidden friend modal");
		$rootScope.shownModal = null;
	});
	// Execute action on remove modal
	$scope.$on('friendModal.removed', function() {
		// Execute action
		forge.logging.info("removed friend modal");
	});
	//clear friend search
	$scope.clearSearch = function(value) {
		$scope.f.search = '';
	};

	//add friend modal
	$scope.openVerifyPhone = function() {
		// Create and load add friend modal
		$ionicModal.fromTemplateUrl('templates/verify-phone.html', function(verifyModal) {
			$rootScope.verifyModal = verifyModal;
			$rootScope.verifyModal.show();
			$rootScope.shownModal = $rootScope.verifyModal;
		}, {
			scope: $scope,
			animation: 'slide-in-up'
		});
	};
	//Cleanup the modal when we're done with it!
	$scope.$on('$destroy', function() {
		$rootScope.verifyModal.remove();
		forge.logging.info("destory verify modal");
	});
	// Execute action on hide modal
	$scope.$on('verifyModal.hidden', function() {
		// Execute action
		forge.logging.info("hidden verify modal");
		$rootScope.shownModal = null;
	});
	// Execute action on remove modal
	$scope.$on('verifyModal.removed', function() {
		// Execute action
		forge.logging.info("removed verify modal");
	});
	//clear friend search
	$scope.clearSearch = function(value) {
		
	};	
});