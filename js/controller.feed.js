'use strict';
angular.module('todo.controller.feed', [])
.controller('FeedTabCtrl', function($scope, $stateParams, waitForAuth, $rootScope, $location, $firebase, $ionicModal, $ionicPopup, $ionicLoading, $timeout, $state) {
	
	var feed;
	var seen;
	
	$scope.data = {
		feed: null,
		feedLoading: true,
		displayed: 10,
		hasMoreData: true,
		//seen: new Date().getTime()-600000,
		//seen: 100,
		content: "",
		annonymous: false,
		friends: {},
		friendNames: {},
		messages: {},
		lastKey: null,
		canLoadMore: false,
		hasAllFriends: false, // all friends checked in new message
		isSending: false
	};
	$rootScope.messageButton = 'feed';
	$rootScope.moreFeedData = false;
	$rootScope.badges.feed = 0;
	
		$scope.data.feed = $rootScope.feed;
		if ($scope.data.feed) {
			$scope.data.feed.$on("loaded",function(){
				$scope.data.feedLoading = false;
			});
			$scope.data.feed.$on("child_added",function(){
				$scope.data.hasMoreData = true; // so ininite scroll can work
			});
			forge.notification.hideLoading(function(){}, function(err){});
		}
		
	$timeout(function(){
		$scope.data.displayed = 100;
	},800);
	
/*	// Users feed seen values
	seen = $rootScope.ref.child("users/"+$rootScope.auth.user.uid).child("seen");
	seen.once("value",function(snap){
		forge.logging.info(snap.val());
		if (snap.val()) {
			$scope.data.seen = snap.val();
		}
	});
	// update seen time
	$timeout(function(){
		var d = new Date().getTime();
		seen.set(d);
		$scope.data.seen = d;
		$scope.$apply();
	},20000);*/
	
	$scope.gotoComments = function(id) {
		$state.transitionTo('comments', {randid: id});
	};
	
	$scope.feedRefresh = function() {
		$timeout( function() {
			$rootScope.feedRef = new Firebase('https://canchat.firebaseio.com/feed/'+$rootScope.auth.user.uid).limit(100);
			$rootScope.feed = $firebase($rootScope.feedRef);
			$rootScope.feed.$on("loaded", function() {
				$scope.$broadcast('scroll.refreshComplete');
			});
        }, 1000);
	};
	$scope.loadMoreFeed = function() {
		forge.logging.info("loading more.");
		// feed is set
		if ($scope.feed != null) {
			// get feed keys
			var keys = $scope.feed.$getIndex();
			if (keys.length > $scope.data.displayed) {
				$scope.data.displayed += 10;
			} else {
				$scope.data.hasMoreData = false;
			}
		}
		$scope.$broadcast('scroll.infiniteScrollComplete');
		$timeout(function(){
			
		},500);
		
	/*	console.log($scope.data.lastKey);
		$timeout(function(){
			$rootScope.feedRef.limit(20).startAt(null,$scope.data.lastKey).once("value",function(snap){
				console.log(snap.val());
				var msgs = snap.val();
				if (msgs) {
					for (var i in msgs) {
						$scope.data.messages[i] = msgs[i];
						$scope.data.lastKey = i;
					}
				}
				$scope.$broadcast('scroll.infiniteScrollComplete');
			});
		},1000);
		
		$rootScope.feedLimit += 10;
		console.log($rootScope.feedLimit);
		$timeout(function(){
			$rootScope.feedRef = new Firebase('https://canchat.firebaseio.com/feed/'+$rootScope.auth.user.uid).limit($rootScope.feedLimit);
			$rootScope.feed = $firebase($rootScope.feedRef);
			$rootScope.feed.$on("loaded",function(){
				console.log("loaded new results");
				$scope.$broadcast('scroll.infiniteScrollComplete');
			});
		},1000);*/
		
	};
	
	
	function checkAllFriends() {
		var hasAll = true;
		var keys = $rootScope.friends.$getIndex();
		keys.forEach(function(key, i) {
			var uid = $rootScope.friends[key].uid;
			if (uid in $scope.data.friends) {
				if (!$scope.data.friends[uid])
					hasAll = false;
			} else
				hasAll = false;
		});
	/*	for (var i in $rootScope.friends) {
			if (i in $scope.data.friends) {
				if (!$scope.data.friends[i])
					hasAll = false;
			} else
				hasAll = false;
		}*/
		$scope.data.hasAllFriends = hasAll;
		
	}
	$scope.appendAllFriends = function() {
		var keys = $rootScope.friends.$getIndex();
		keys.forEach(function(key, i) {
			$scope.data.friends[$rootScope.friends[key].uid] = true;
			$scope.data.friendNames[$rootScope.friends[key].uid] = $rootScope.friends[$rootScope.friends[key].uid].name;
			//console.log(i, $rootScope.friends[key]); // Prints items in order they appear in Firebase.
		});
	/*	for (var i in $rootScope.friends) {
			$scope.data.friends[i] = true;
			$scope.data.friendNames[i] = $rootScope.friends[i].name;
		}*/
		$scope.data.hasAllFriends = true;
	};
	$scope.removeAllFriends = function() {
		var keys = $rootScope.friends.$getIndex();
		keys.forEach(function(key, i) {
			var uid = $rootScope.friends[key].uid;
			$scope.data.friends[uid] = false;
		});
		$scope.data.hasAllFriends = false;
	};
	$scope.appendNewMessageFriend = function(friend, name) {
		$scope.data.friends[friend] = true;
		$scope.data.friendNames[friend] = name;
		checkAllFriends();
	};
	$scope.removeNewMessageFriend = function(friend) {
		$scope.data.friends[friend] = false;
		checkAllFriends();
	};
	
	function failedMessage() {
		var alertPopup = $ionicPopup.alert({
			title: 'Message failed!',
			template: 'Sorry, could not send that message. Try again.'
		});
		alertPopup.then(function(res) {
			
		});
		$timeout(function() {
			alertPopup.close(); //close the popup after 3 seconds for some reason
		}, 3000);
	}
	
	$scope.sendMessage = function() {
		if (!$scope.data.content)
			return false;
			
		var date = new Date().getTime();
		var content = $scope.data.content;
	//	var sender = (!$scope.data.annonymous) ? $rootScope.auth.user.uid : false;
		var sender = $rootScope.auth.user.uid;
		var sendTo = {};
		var sendToArr = [];
		var senderName;
		var toNames = []; // the receiver of a pm
		for (var i in $scope.data.friends) {
			if ($scope.data.friends[i]) {
				sendTo[i] = true;
				sendToArr.push(i);
				toNames.push($scope.data.friendNames[i]);
			}
		}
		
		if (sendToArr.length < 1)
			return false;
	
		// validate message
		
		$ionicLoading.show({
			template: 'Sending'
		});
		
		forge.logging.info("User id: "+$rootScope.auth.user.uid);
		
		/*
		 *	Send the message
		 */
			$timeout(function(){
				$scope.data.isSending = true;
				$scope.$apply();
			});
			forge.request.ajax({
				type: 'POST',
				url: 'http://still-garden-8974.herokuapp.com/message',
				data: { token: $rootScope.token, content: content, to: sendToArr, anonymous: $scope.data.annonymous, date: date },
				dataType: 'json',
				success: function(data, headers) {
					forge.logging.info('MESSAGE SUCCESS: '+JSON.stringify(data));
					$scope.data.content = "";
					$scope.data.friends = {};
					checkAllFriends();
					$rootScope.closeNewTask();
					$scope.data.isSending = false;
					$scope.$apply();
				},
				error: function(error) {
					forge.logging.info('MESSAGe FAILED: '+JSON.stringify(error));
					$scope.data.isSending = false;
					$scope.$apply();
				}
			});
			$timeout(function(){
				$ionicLoading.hide();
			},1000);
			
		/*
		var ref = new Firebase('https://canchat.firebaseio.com');
		ref.child("people/"+$rootScope.auth.user.uid+"/name").once("value",function(dat){
		
			forge.logging.info("Your name: "+JSON.stringify(dat.val()));
			
			senderName = dat.val();
			if (!senderName) {
				return;
			}
			forge.logging.info("You anon: "+$scope.data.annonymous);
			if ($scope.data.annonymous)
				senderName = false;
			var publicSendTo = sendTo;
			publicSendTo[$rootScope.auth.user.uid] = true;
			//var msgRef = ;
			forge.logging.info("Pre message ref set");
			var messages = $firebase(ref.child("messages"));
			forge.logging.info("Post message ref set");
			// create new message
			messages.$add({
				content: $scope.data.content,
				sent_to: publicSendTo,
				sender: sender,
				name: senderName,
				annonymous: $scope.data.annonymous,
				created_at: date,
				updated_at: date
			}).then(function(msg){
				var randId = msg.name();
			forge.logging.info(msg.name());
				var baseFeedRef = ref.child("feed");
				var devices = [];
				// for each sendTo create a message feed
				for (var i in sendTo) {
					forge.logging.info("Sending to user: "+i);
					baseFeedRef.child(i).child(randId).setWithPriority({
						content: $scope.data.content,
						created_at: date,
						updated_at: date,
						sent_to: sendToArr.length, // length of array excluding sender
						sender: sender, // uid
						to: false, // uh uh uh, not your message to know
						name: senderName,
						comments: [],
						message: randId,
						comment_count: 0
					}, date, function(err){ 
						forge.logging.error("Create others feed error: "+JSON.stringify(err));
					});
				}
				// send to yourself
				baseFeedRef.child($rootScope.auth.user.uid).child(randId).setWithPriority({
					content: $scope.data.content,
					created_at: date,
					updated_at: date,
					sent_to: sendToArr.length,
					sender: $rootScope.auth.user.uid,
					name: senderName,
					comments: [],
					message: randId,
					comment_count: 0,
					to: toNames.join(', ')
				}, date, function(err) {
					forge.logging.error("Create user feed error: "+JSON.stringify(err));
				});
				$scope.data.content = "";
				$scope.data.friends = {};
				checkAllFriends();
				$rootScope.closeNewTask();
				$ionicLoading.hide();
				
				// send push notification request
				//var pushChannels = [];
				var pushType = (sendToArr.length > 1) ? "push_new" : "push_pm";
				var pushFrom = (senderName) ? senderName : "Anonymous";
				for (var i in sendTo) {
					if (i == $rootScope.auth.user.uid)
						continue;
					//	pushChannels.push("user_"+pushType+"_"+i.replace(":","_"));
					//pushChannels.push("user_"+i.replace(":","_"));
					ref.child("users").child(i).once("value",function(snap){
						forge.logging.info("User "+i+" has push: "+JSON.stringify(snap.val()));
						if (snap.val()) {
							var user = snap.val();
							if (!user[pushType])
								return;
							Parse.Push.send(
								{
									channels: ["user_"+user.uid.replace(":","_")],
									data: {
										alert: pushFrom+": "+content
									}
								},{
									success: function() {
										forge.logging.info("Pushed to "+ JSON.stringify(["user_"+user.uid.replace(":","_")]));
									},
									error: function(error) {
										// Handle error
										//forge.logging.info("Failed pushed to "+ JSON.stringify(pushChannels));
										forge.logging.info(JSON.stringify(error));
									}
								}
							);
						}
					});
				}
				/*
				if (pushChannels.length) {
					var pushFrom = (senderName) ? senderName : "Anonymous";
					Parse.Push.send(
						{
							channels: pushChannels,
							data: {
								alert: pushFrom+": "+content
							}
						}, {
						success: function() {
							forge.logging.info("Pushed to "+ JSON.stringify(pushChannels));
						},
						error: function(error) {
							// Handle error
							forge.logging.info("Failed pushed to "+ JSON.stringify(pushChannels));
							forge.logging.info(JSON.stringify(error));
						}
					});
				}
				*/
	/*		},function(err){
				forge.logging.error("Create public message error: "+JSON.stringify(err));
				if (err) {
					$ionicLoading.hide();
					failedMessage();
				}
			});
		}, function(err) {
			forge.logging.error("Find user error: " + JSON.stringify(err));
			if (err) {
				$ionicLoading.hide();
				failedMessage();
			}
		});
		*/
	};
	
	$scope.deleteMessage = function(randid) {
		if (randid) {
			$rootScope.feed.$remove(randid).then(function(d){
				// find the user in the public message sent_to and remove from
				var ref = new Firebase('https://canchat.firebaseio.com/messages');
				ref.child(randid).child("sent_to").once("value",function(snap){
					var sent_to = snap.val();
					if (sent_to) {
						for (var i in sent_to) {
							if (sent_to[i] == $rootScope.auth.user.uid)
								sent_to.splice(i,1);
						}
						ref.child(randid).child("sent_to").set(sent_to);
					}
				});
			});
		}
	};
	
	$scope.clearSearch = function() {
		$scope.data.searchFilter = '';
	}
	
	function assertValidLoginAttempt() {
		if( !$scope.data.content ) {
			$scope.data.err = 'Please enter an email address';
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