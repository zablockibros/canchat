'use strict';
angular.module('todo.controller.comments', ['waitForAuth'])
.controller('CommentsCtrl', function($scope, $stateParams, waitForAuth, $rootScope, $location, $firebase, $ionicModal, $ionicLoading) {
	
	$rootScope.commentFeedId = $stateParams.randid;
	
	$scope.data = {
		content: "",
		annonymous: false,
		toSender: false,
		feedId: $rootScope.commentFeedId,
		isSending: false
	};
	
	$rootScope.messageButton = 'comment';
	
	if ($rootScope.commentFeedId) {
		waitForAuth.then(function() {
			// create a reference to this persons feed of comments
			var messageRef = new Firebase('https://canchat.firebaseio.com/feed/'+$rootScope.auth.user.uid+'/'+$rootScope.commentFeedId);
			$scope.selectedMessage = $firebase(messageRef);
			$scope.selectedMessage.$on("loaded",function(){
				forge.logging.info(JSON.stringify($scope.selectedMessage));
				if ($scope.selectedMessage.name == false && $scope.selectedMessage.sender == $rootScope.auth.user.uid) {
					forge.logging.info("set to anon");
					$scope.data.annonymous = true;
					$scope.$apply();
				}
			});
			var commentRef = new Firebase('https://canchat.firebaseio.com/feed_comments/'+$rootScope.auth.user.uid+'/'+$rootScope.commentFeedId).limit(50);
			$scope.comments = $firebase(commentRef);
		});
	}
	
	
	
	$scope.sendComment = function() {
		if (!$scope.data.content)
			return false;
			
		var date = new Date().getTime();
		var content = $scope.data.content;
		//var sender = (!$scope.data.annonymous) ? $rootScope.auth.user.uid : false;
		var sender = $rootScope.auth.user.uid;
		var sendTo = {};
		var sendToArr = [];
		var senderName;
		var to = ($scope.data.toSender) ? 'sender' : 'all';
	
		// validate message
		
		$ionicLoading.show({
			template: 'Sending'
		});
		

		/*
		 *	Send the message
		 */
			$timeout(function(){
				$scope.data.isSending = true;
				$scope.$apply();
			});
			forge.request.ajax({
				type: 'POST',
				url: 'http://still-garden-8974.herokuapp.com/reply',
				data: { token: $rootScope.token, content: content, to: to, anonymous: $scope.data.annonymous, date: date, message: $rootScope.commentFeedId },
				dataType: 'json',
				success: function(data, headers) {
					forge.logging.info('REPLY SUCCESS: '+JSON.stringify(data));
					$scope.data.content = "";
					$rootScope.closeNewComment();
					//$ionicLoading.hide();
					$scope.data.isSending = false;
					$scope.$apply();
				},
				error: function(error) {
					forge.logging.info('REPLY FAILED: '+JSON.stringify(error));
					//$ionicLoading.hide();
					$scope.data.isSending = false;
					$scope.$apply();
				}
			});
			$timeout(function(){
				$ionicLoading.hide();
			},1000);
		
		/*
		// get your own name
		$rootScope.ref.child("people/"+$rootScope.auth.user.uid+"/name").once("value",function(dat){
			senderName = dat.val();
			if (!senderName) {
				$ionicLoading.hide();
			}
		//console.log(senderName);
			if ($scope.data.annonymous)
				senderName = false;
			var publicMsgRef = new Firebase('https://canchat.firebaseio.com/messages/'+$rootScope.commentFeedId);
			// get the public message record
			publicMsgRef.once("value",function(msg){
				msg = msg.val(); // got who sent to
				if (!msg) {
					$ionicLoading.hide();
				}
				// put all sent_to into the sendTo
				for (var i in msg.sent_to) {
					sendToArr.push(i);
					sendTo[i] = true;
				}
				// sending only to sender
				if ($scope.data.toSender) {
					// is sender still in the feed
					if (msg.sender in sendTo) {
						sendTo = {};
						sendTo[msg.sender] = true;
						sendTo[$rootScope.auth.user.uid] = true;
						sendToArr = [msg.sender];
					}
				}
					
				var publicCommentRef = publicMsgRef.child("comments");
				// create public comment record
				var $publicComment = $firebase(publicCommentRef);
				// create new public comment
				
				$publicComment.$add({
					content: $scope.data.content,
					sent_to: sendTo,
					sender: sender,
					name: senderName,
					annonymous: $scope.data.annonymous,
					created_at: date,
					updated_at: date
				})
				.then(function(ref){
					var randId = ref.name();
					var baseFeedRef = new Firebase('https://canchat.firebaseio.com/feed_comments');
					// for each sendTo create a message feed
					for (var i in sendTo) {
						//baseFeedRef.child(sendTo[i]).child($rootScope.commentFeedId).update({updated_at:date});
						baseFeedRef.child(i).child($rootScope.commentFeedId).child(randId).set({
							content: $scope.data.content,
							created_at: date,
							updated_at: date,
							sent_to: sendToArr.length,
							sender: sender,
							name: senderName,
							comment: randId,
							message: $rootScope.commentFeedId
						});
						baseFeedRef.parent().child("feed").child(i).child($rootScope.commentFeedId).update({updated_at:date});
						baseFeedRef.parent().child("feed").child(i).child($rootScope.commentFeedId).setPriority(date);
						baseFeedRef.parent().child("feed").child(i).child($rootScope.commentFeedId).child("comment_count").transaction(function(current_value) {
							//console.log("inc mine "+sendTo[i]);
							//console.log(current_value);
							return current_value + 1;
						});
					}
			*/
			/*		// send comment to yourself
					baseFeedRef.child($rootScope.auth.user.uid).child($rootScope.commentFeedId).child("comments").child(randId).set({
						content: $scope.data.content,
						created_at: date,
						sent_to: sendTo.length,
						sender: sender,
						name: senderName,
						comment: randId
					},function(err){
						// incremement the comment count
						if (!err) {
							baseFeedRef.child($rootScope.auth.user.uid).child($rootScope.commentFeedId).child("comment_count").transaction(function(current_value) {
							console.log("inc mine "+$rootScope.auth.user.uid);
							console.log(current_value);
								return current_value + 1;
							});
						}
					});*/
				/*
					$scope.data.content = "";
					$rootScope.closeNewComment();
					$ionicLoading.hide();
					
					// send push notification request
					var ref = publicMsgRef.parent().parent();
					var pushType = (sendToArr.length > 1) ? "push_new_comments" : "push_pm_comments";
					var pushFrom = (senderName) ? senderName : "Anonymous";
					for (var i in sendTo) {
						if (i == $rootScope.auth.user.uid)
							continue;
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
											alert: pushFrom+" reply: "+content
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
					
				});
				
			});
		});
		*/
	};
	
	$scope.deleteComment = function(randid, message) {
		//console.log(randid);
		//console.log(message);
		$scope.comments.$remove(randid).then(function(d){
			//alert("deleted");
			//console.log(d);
			var baseFeedRef = new Firebase('https://canchat.firebaseio.com/feed_comments');
			baseFeedRef.parent().child("feed").child($rootScope.auth.user.uid).child(message).child("comment_count").transaction(function(current_value) {
				return current_value - 1;
			});
		});
	};
	
});