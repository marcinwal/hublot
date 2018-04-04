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

// This file is used to define the structure and the behavior of the robot.
//
// It is the first file of the `robot` folder to be loaded in the client.

/* global robot:true robotController robotLib MediaRecorder */
/* exported robot */

robot = {
  // The variable 'room' and 'clientConfig' will be initialized at the call of start function
  room: '',
  clientConfig: {},
  previousReco: [],
  recordedParticipantsWS: {},
  participantsMediaRecorders: {},
  isDisconnected: false,
  intervalList: [],

  processAudio(stream, callback, interval) {
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = callback;
    mediaRecorder.start(interval);
    return mediaRecorder;
  },

  processReco(reco) {
    reco = JSON.parse(reco);
    let formattedReco = '';
    const newPreviousReco = [];
    let isRecom = false;

    if (reco.keywords && reco.keywords.length > 0) {
      for (let i = 0; i < reco.keywords.length; i++) {
        if (!isRecom && robot.previousReco.indexOf(reco.keywords[i].key) === -1) {
          isRecom = true;
        }
        newPreviousReco.push(reco.keywords[i].key);
      }
      robot.previousReco = newPreviousReco;

      if (!isRecom) {
        return;
      }

      formattedReco += '<h5>Mots-Clés</h5> ';
      for (let i = 0; i < reco.keywords.length; i++) {
        formattedReco += reco.keywords[i].key + ', ';
      }
      // Remove last ', '
      formattedReco = formattedReco.substring(0, formattedReco.length - 2);
    }

    if (reco.wikiarticles && reco.wikiarticles.length > 0) {
      formattedReco += '<h5>Wikipedia</h5>';
      for (let i = 0; i < reco.wikiarticles.length && i < 5; i++) {
        formattedReco += '<p><a href="' + encodeURI(reco.wikiarticles[i].link) + '" target="_blank">' + reco.wikiarticles[i].title + '</a>';
      }
    }

    if (reco.soArticles && reco.soArticles.length > 0) {
      formattedReco += '<h5>StackOverflow</h5>';
      for (let i = 0; i < reco.soArticles.length && i < 5; i++) {
        formattedReco += '<p><a href="' + encodeURI(reco.soArticles[i].link) + '" target="_blank">' + reco.soArticles[i].title + '</a>';
      }
    }

    console.log(formattedReco);
    if (formattedReco !== '') {
      robotController.sendMessage(robot.clientConfig.name, robot.clientConfig.avatar, formattedReco);
    }
  },

  openSTTSocket(easyrtcid) {
    const ws = robotLib.stt.getTranscriptSocket(e => {
      console.log('> ' + e.text);
      robotLib.reco.send(
        {
          from: robot.room,
          text: e.from + '\t' + e.until + '\t' + easyrtcid + '\t' + e.text
        });
    });
    ws.addEventListener('error', e => {
      // Try to open new connection on error
      console.error('STT ws for ' + easyrtcid + ' error. Trying to reopen');
      console.error(e);
      robot.openSTTSocket(easyrtcid);
    });
    robot.recordedParticipantsWS[easyrtcid] = ws;
  },

  getUserStream(easyrtcid) {
    robotController.getRemoteStream(easyrtcid).then(stream => {
      if (stream !== undefined) {
        robot.participantsMediaRecorders[easyrtcid] = robot.processAudio(stream, e => robot.audioGenerator(easyrtcid, e), 100);
      }
    });
  },

  audioGenerator(easyrtcid, e) {
    robot.recordedParticipantsWS[easyrtcid].send(e.data);
  },


  recordParticipant(easyrtcid) {
    robot.openSTTSocket(easyrtcid);
    robot.getUserStream(easyrtcid);
  },

  stopRecordParticipant(easyrtcid) {
    if (robot.participantsMediaRecorders[easyrtcid]) {
      robot.participantsMediaRecorders[easyrtcid].stop();
    }
    if (robot.recordedParticipantsWS[easyrtcid]) {
      robot.recordedParticipantsWS[easyrtcid].close();
    }
  },

  checkDisconnect() {
    if (robotController.getRemoteParticipants().length === 0) {
      robot.stop();
    }
  },

  clearConnection() {
    for (let i = 0; i < robot.intervalList.length; i++) {
      clearInterval(robot.intervalList[i]);
    }
    robot.intervalList = [];

    const keyMap = Object.keys(robot.recordedParticipantsWS);
    if (keyMap) {
      for (let i = 0; i < keyMap.length; i++) {
        try {
          robot.stopRecordParticipant(keyMap[i]);
        } catch (err) {
          console.log('This user is inactive');
        }
      }
    }
  },

  start: (room, clientConfig) => {
    robot.room = room;
    robot.clientConfig = clientConfig;

    robotLib.stt = robotLib.stt(robot.clientConfig);
    robotLib.reco = robotLib.reco(robot.clientConfig);
    robotLib.archive = robotLib.archive(robot.clientConfig);

    robotController.onAttendeePush = (e, data) => {
      robotController.getMyId().then(rtcid => {
        if (data.rtcid !== rtcid) {
          robot.recordParticipant(data.rtcid);
        }
      });
    };

    robotController.onAttendeeRemove = (e, data) => {
      robot.stopRecordParticipant(data.easyrtcid);
      robot.checkDisconnect();
    };

    robotController.getWebRTCAdapter().addDisconnectCallback(() => {
      robot.clearConnection();
    });

    const recoStartRetry = () => {
      if (robotLib.reco.start(robot.room)) {
        clearInterval(robot.recoInterval);
      }
    };
    robot.recoInterval = setInterval(recoStartRetry, 8000);

    robot.intervalList.push(robot.recoInterval);
    robot.intervalList.push(
      setInterval(() => robotLib.reco.getOnlineReco(robot.room)
        .then(robot.processReco)
        .catch(console.error),
      8000));

    // Record current participants already present in the room
    // (except the robot itself)
    for (const participantId of robotController.getRemoteParticipants()) {
      robotController.getMyId().then(rtcid => {
        if (participantId !== rtcid) {
          robot.recordParticipant(participantId);
        }
      });
    }

    // Wait 5 minute before leaving a room if alone
    robot.intervalList.push(setInterval(robot.checkDisconnect, 300000));
  },

  stop: () => {
    robot.isDisconnected = true;
    robotController.disconnect();
    robot.clearConnection();

    // This function is set by the server
    /* eslint-disable no-undef */
    notifyEndToServer();
    /* eslint-enable */

    return true;
  }
};

console.log('robot initialized');
