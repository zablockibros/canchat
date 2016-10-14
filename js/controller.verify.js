'use strict';
angular.module('todo.controller.verify', [])
.controller('VerifyCtrl', function($scope, $location, $rootScope, $firebase, $firebaseSimpleLogin, $ionicLoading, $ionicModal, $ionicPopup) {
   	
	$scope.data = {
		number: null
	};
	
	$scope.hasSettings = false;
	var meRef = new Firebase('https://canchat.firebaseio.com/users/'+$rootScope.auth.user.uid);
	$scope.me = $firebase(meRef);
	$scope.me.$bind($scope, "settings");
	$scope.me.$on("loaded", function(){
		$scope.hasSettings = true;
	});
	
	$scope.getCode = function(number) {
		var number = number || $scope.data.number;
		if (number) {
			$ionicLoading.show({
				template: 'Sending code...'
			});
			/*
			 *	Get verify code
			 */
			forge.request.ajax({
				type: 'POST',
				url: 'http://still-garden-8974.herokuapp.com/get_verify',
				data: { token: $rootScope.token, number: number },
				dataType: 'json',
				success: function(data, headers) {
					forge.logging.info('GET CODE SUCCESS: '+JSON.stringify(data));
					$ionicLoading.hide();
				},
				error: function(error) {
					forge.logging.info('GET CODE FAILED: '+JSON.stringify(error));
					$ionicLoading.hide();
				}
			});
		}
		
	};
	
	$scope.verifyCode = function() {
		if ($scope.data.code) {
			$ionicLoading.show({
				template: 'Sending code...'
			});
			/*
			 *	Get verify code
			 */
			forge.request.ajax({
				type: 'POST',
				url: 'http://still-garden-8974.herokuapp.com/verify',
				data: { token: $rootScope.token, code: $scope.data.code },
				dataType: 'json',
				success: function(data, headers) {
					$scope.closeVerifyPhone();
					
					forge.logging.info('verify CODE SUCCESS: '+JSON.stringify(data));
					$ionicLoading.hide();
				},
				error: function(error) {
					forge.logging.info('verify CODE FAILED: '+JSON.stringify(error));
					$ionicLoading.hide();
				}
			});
		}
	};
	
	$scope.closeVerifyPhone = function() {
		$rootScope.verifyModal.hide().then(function(){
			$rootScope.verifyModal.remove();
		});
	};
	
});