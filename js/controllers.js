angular.module('todo', ['ionic', 'firebase'])

.controller('RootCtrl', function($scope, $ionicModal, $http) {
	// Create and load the Modal
	$ionicModal.fromTemplateUrl('new-task.html', function(modal) {
		$scope.taskModal = modal;
	}, {
		scope: $scope,
		animation: 'slide-in-up'
	});
	$scope.newTask = function() {
		$scope.taskModal.show();
	};
	// Close the new task modal
	$scope.closeNewTask = function() {
		$scope.taskModal.hide();
	};
	// Create and load add friend modal
	$ionicModal.fromTemplateUrl('new-friend.html', function(modal) {
		$scope.friendModal = modal;
	}, {
		scope: $scope,
		animation: 'fade-in'
	});
	//add friend modal
	$scope.newFriend = function() {
		$scope.friendModal.show();
	};
	// Close the new task modal
	$scope.closeNewFriend = function() {
		$scope.friendModal.hide();
	};
})

.controller('FriendsCtrl', function($scope, $http) {
	$scope.items = [1,2,3];
	$scope.doRefresh = function() {
		alert("ok");
	};
})

.controller('FeedCtrl', function($scope, $http) {
	alert("ok");
})

.controller('SettingsCtrl', function($scope, $http) {

})
