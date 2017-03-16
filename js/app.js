(function() {
  'use strict';

  var uuid, avatar, color, cat;

  // Assign a uuid made of a random cat and a random color
  var randomColor = function() {
    var colors = ['navy'];
    return colors[(Math.random() * colors.length) >>> 0];
  };

  var randomCat = function() {
    var cats = ['estudiante'];
    return cats[(Math.random() * cats.length) >>> 0];
  };

  color = randomColor();
  cat = randomCat();
  uuid = color + '-' + cat;
  avatar = 'images/' + cat + '.jpg';

  function showNewest() {
    //document.querySelector('core-scaffold').$.headerPanel.scroller.scrollTop = document.querySelector('.chat-list').scrollHeight;

    var chatDiv = document.querySelector('.chat-list');
    chatDiv.scrollTop = chatDiv.scrollHeight; //TODO: Need to fix so that we can find the .chat-list class object
  }

  /* Polymer UI and UX */

  var template = document.querySelector('template[is=dom-bind]');

  template.channel = 'polymer-chat3';
  template.uuid = uuid;
  template.avatar = avatar;
  template.color = color;
  template.cats = [];

  // Sending a chat message by pressing a keyboard return key
  template.checkKey = function(e) {
    if(e.keyCode === 13 || e.charCode === 13) {
      template.publish();
    }
  };
  // Sending a chat message by clicking a "Send" button
  template.sendMyMessage = function(e) {
    template.publish();
  };

  template.messageList = [];


  /* PubNub Realtime Chat */

  var pastMsgs = [];
  var onlineUuids = [];

  template.getListWithOnlineStatus = function(list) {
    [].forEach.call(list, function(l) {
      // sanitize avatars
      var localObj = JSON.parse(localStorage.getItem("sender"));
      if (  l.uuid.indexOf (localObj._id) == -1 ){
        return;
      }
      var catName = (l.uuid + '').split('-')[2];
      l.avatar = 'images/' + catName + '.jpg';

      if (catName === undefined || /\s/.test(l.uuid)) {
        l.uuid = 'fail-cat';
        console.log('Oh you, I made this demo open so nice devs can play with, but you are not nice. Please use your keys, and do not mess with this chat room.');
      }

      // Check status
      if(template.cats.indexOf(l.uuid) > -1) {
        l.status = 'online';
      } else {
        l.status = 'offline';
      }
    });
    return list;
  };

  template.displayChatList = function(list) {
    // scroll to bottom when all list items are displayed
    var newlist = [];
    for (var i=0; i < list.length; i++) {


      var localObj = JSON.parse(localStorage.getItem("sender"));
      if (list[i].uuid.indexOf (localObj._id) == -1 ) {
        continue;
      }
      newlist.push (list[i]);

    }
    template.messageList = newlist;
    template.async(showNewest);
  };

  template.subscribeCallback = function(e) {
    if(template.$.sub.messages.length > 0) { console.log(template.$.sub.messages);
        this.displayChatList(pastMsgs.concat(this.getListWithOnlineStatus(template.$.sub.messages)));
    }
  };

  template.presenceChanged = function(e) {
    var i = 0;
    var l = template.$.sub.presence.length;
    var d = template.$.sub.presence[l - 1];

    // how many users
    template.occupancy = d.occupancy;

    // who are online
    if(d.action === 'join') {
      if(d.uuid.length > 35) { // pubnub admin console
        d.uuid = 'the-mighty-big-cat';
      }
      var localObj = JSON.parse(localStorage.getItem("sender"));
      this.push('cats', localObj._id +   "-" + d.uuid);

    } else {
      var idx = template.cats.indexOf(d.uuid);
      if(idx > -1) {
        this.splice('cats', idx, 1);
      }
    }

    i++;

    // update the status at the main column
    if(template.messageList.length > 0) {
      template.messageList = this.getListWithOnlineStatus(template.messageList);
    }
  };

  template.historyRetrieved = function(e) {
  if(e.detail[0].length > 0) {
      pastMsgs = this.getListWithOnlineStatus(e.detail[0]);
      this.displayChatList(pastMsgs);
    }
  };

  template.publish = function() {
    if(!template.input) return;
    var localObj = JSON.parse(localStorage.getItem("sender"));

    template.$.pub.message = {
      uuid: localObj._id +   "-" + uuid,
      uuid_real: sessionStorage.getItem('username'),
      avatar: avatar,
      color: color,
      text: template.input,
      timestamp: new Date().toISOString()
    };
    template.$.pub.publish();
    template.input = '';
  };

  template.error = function(e) {
      console.log(e);
  };

  template._colorClass = function(color) {
      return 'middle avatar '+color;
  };

  template._backgroundImage = function(avatar) {
      return 'background-image: url('+avatar+');';
  };
  //


})();
