'use strict';
angular.module('todo.controller.login', ['todo.service.login','firebase'])
.controller('LoginCtrl', function($scope, $location, $rootScope, $firebase, $firebaseSimpleLogin, $ionicLoading) {
	var fbref = $rootScope.ref;
//	var auth = $firebaseSimpleLogin(fbref);
	var auth = new FirebaseSimpleLogin(fbref, function(error, user) {
		if (error) {
			// an error occurred while attempting login
			$scope.data.err = 'Invalide email or password';
			switch(error.code) {
				case 'INVALID_EMAIL':
					$scope.data.err = 'Invalide email or password';
					break;
				case 'INVALID_PASSWORD':
					$scope.data.err = 'Invalide email or password';
					break;
				default:
					$scope.data.err = 'Invalide email or password';
					break;
			}
			$ionicLoading.hide();
		} else if (user) {
			// user authenticated with Firebase
			//console.log('This is controller User ID: ' + user.uid + ', Provider: ' + user.provider);
			$location.replace();
			$location.path('/feed');
			$ionicLoading.hide();
		} else {
			// user is logged out
		}
	});
	$scope.data = {
		email: null,
		pass: null,
		confirm: null,
		err: null
	};
	$scope.createMode = false;

	//loginService.init();
			
	$scope.login = function(cb) {
		$scope.data.err = null;
		if( !$scope.data.username ) {
			$scope.data.err = 'Please enter a username';
		}
		else if( !$scope.data.pass ) {
			$scope.data.err = 'Please enter a password';
		}
		else {
			$ionicLoading.show({
				template: 'Logging in'
			});
			// find email for username
			new Firebase("https://canchat.firebaseio.com/people")
			.startAt($scope.data.username)
			.endAt($scope.data.username)
			.once('value', function(snap) {
				if (!snap.val()) {
					$scope.data.err = 'Username or password was invalid';
					$ionicLoading.hide();
				} else {
					var person = snap.val();
					var email = null;
					for (var i in person) {
						if ("email" in person[i])
							email = person[i].email;
					}
					if (email) {
						auth.login('password', {
							email: email,
							password: $scope.data.pass,
							rememberMe: true
						});
					} else {
						$scope.data.err = 'Username or password was invalid';
						$ionicLoading.hide();
					}
				}
			});
		}
	};

	$scope.createAccount = function() {
		$scope.data.err = null;
		var pass = $scope.data.pass;
		if( assertValidLoginAttempt() ) {
			$ionicLoading.show({
				template: 'Joining'
			});
			// check availability of username
			new Firebase("https://canchat.firebaseio.com/people")
			.startAt($scope.data.username)
			.endAt($scope.data.username)
			.once('value', function(snap) {
	console.log(snap.val());
				if (snap.val()) {
					$scope.data.err = 'Sorry, that username already exists';
					$ionicLoading.hide();
				} else {
					// create the user
					auth.createUser($scope.data.email, $scope.data.pass, function(error, user) {
		console.log(user);
		console.log(error);
						if (!error) {
							// must be logged in before I can write to my profile
							// write their profile
							var userRef = fbref.child('users/'+user.uid);
							var peopleRef = new Firebase('https://canchat.firebaseio.com/people/'+user.uid);
							userRef.set({
								email: user.email,
								name: $scope.data.username,
								push_new: true,
								push_pm: true,
								push_new_comments: false,
								push_pm_comments: false
							}, function(error) {
								if (error) {
									//alert('Data could not be saved.' + error);
								} else {
									//alert('Data saved successfully.');
								}
							});
							// save the public person record with priority search on username
							peopleRef.setWithPriority({
								email:user.email,
								name:$scope.data.username,
							}, $scope.data.username);
							// log them in
							$rootScope.auth.$login('password', {
								email: user.email,
								password: pass,
								rememberMe: true
							});
						} else {
							switch(error.code) {
								case 'EMAIL_TAKEN':
									$scope.data.err = 'That email is already in use';
									break;
								case 'INVALID_EMAIL':
									$scope.data.err = 'Invalide email address';
									break;
								case 'INVALID_PASSWORD':
									$scope.data.err = 'Invalide password';
									break;
								default:
									$scope.data.err = 'Invalide account information';
									break;
							}
							$ionicLoading.hide();
						}
					});
				}
			});
		}
	};
	

	function firstPartOfEmail(email) {
		return ucfirst(email.substr(0, email.indexOf('@'))||'');
	}

	function ucfirst (str) {
		// credits: http://kevin.vanzonneveld.net
		str += '';
		var f = str.charAt(0).toUpperCase();
		return f + str.substr(1);
	}

	function assertValidLoginAttempt() {
		if( !$scope.data.email ) {
			$scope.data.err = 'Please enter an email address';
		}
		else if( !$scope.data.username ) {
			$scope.data.err = 'Please enter a username';
		}
		else if( !$scope.data.pass ) {
			$scope.data.err = 'Please enter a password';
		}
		else if( $scope.data.pass !== $scope.data.confirm ) {
			$scope.data.err = 'Passwords do not match';
		}
		return !$scope.data.err;
	}
});