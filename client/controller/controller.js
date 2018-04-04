/*
 * Copyright (c) 2017 Linagora.
 *
 * This file is part of Hublot
 * (see https://ci.linagora.com/linagora/lgs/labs/hublot).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// This file is used to define the global `robotController` object that is used
// to expose the hubl.in services as an unified API to be used by the robot.
//
// It is the first file of the `controller` folder to be loaded in the client.

/* global robotController:true document angular */
/* exported robotController */

robotController = {
  $scope: angular.element(document.body).scope().$root,
  $injector: angular.element(document.body).injector(),

  chatService: angular.element(document.body).injector().get('chat'),

  getWebRTCAdapter: () => {
    return angular.element(document.body).injector().get('webRTCService');
  },

  getMyId: () => {
    return robotController.$injector.get('webRTCService').myRtcid();
  },

  getRemoteStream: participant => {
    return robotController.getWebRTCAdapter().getRemoteStream(participant);
  },

  getRemoteParticipants: () => {
    const participants = robotController.getWebRTCAdapter().getRemoteRtcIds(); // Note that room is exposed globally
    const res = [];
    if (participants) {
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        try {
          const mediaStream = robotController.getRemoteStream(participant);
          if (mediaStream !== null) {
            res.push(participant);
          }
        } catch (err) {
          console.error('could not get remote stream for %s', participant);
          console.error(err);
        }
      }
    }
    return res;
  },

  sendMessage: (author, authorAvatar, message) => {
    robotController.chatService.sendMessage({
      author,
      authorAvatar,
      message,
      displayName: author,
      published: new Date()
    });
  },

  getDisconnectButton: () => {
    return document.getElementsByClassName('conference-user-control-bar')[0].childNodes[0].childNodes[2].childNodes[0]; // Check issue #53
  },

  disconnect: () => {
    angular.element(robotController.getDisconnectButton()).scope().leaveConference();
  },

  onAttendeePush: () => {},
  onAttendeeRemove: () => {},
  onAttendeeUpdate: () => {}
};

robotController.$scope.$on('conferencestate:attendees:push', (event, data) => {
  robotController.onAttendeePush(event, data);
});

robotController.$scope.$on('conferencestate:attendees:remove', (event, data) => {
  robotController.onAttendeeRemove(event, data);
});

robotController.$scope.$on('conferencestate:attendees:update', (event, data) => {
  robotController.onAttendeeUpdate(event, data);
});
