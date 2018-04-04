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

'use strict';

// Let's do some simple mocking of client-side services

const angular = {
  disconnected: false,
  registeredEvents: {},
  element: () => ({
    scope: () => ({
      $root: {
        $on: (event, f) => {
          angular.registeredEvents[event] = f;
        }
      },
      leaveConference: () => {
        angular.disconnected = true;
      }
    }),
    injector: () => ({
      get: () => {
        return {};
      }
    })
  })
};

const easyRTCMock = (participantsWithStream, participantsWithoutStream = []) => ({
  getRoomOccupantsAsArray: () => participantsWithStream
    .concat(participantsWithoutStream),
  getRemoteStream: participant => {
    // Participant must be in list of participants AND not be in the list
    // of participants without stream.
    if (participantsWithStream.indexOf(participant) !== -1) {
      return {
        origin: participant
      };
    }
    return null;
  }
});

const document = {
  body: {}
};

describe('client/controller', () => {
  beforeEach(() => {
    global.document = document;
    global.angular = angular;
    global.easyrtc = easyRTCMock(['p1', 'p2', 'p3']);

    // Room is supposed to be exposed globally
    global.room = 'test';

    /* eslint-disable import/no-unassigned-import */
    require('./controller.js');
    /* eslint-enable */
  });

  test('should set robotController global', () => {
    expect(global.robotController).toBeDefined();
  });

  test('should return the correct participants', () => {
    const participants = global.robotController.getRemoteParticipants();
    expect(participants).toEqual(expect.arrayContaining(['p1', 'p2', 'p3']));
    expect(participants).toHaveLength(3);
  });

  test('should not return participants without stream', () => {
    global.easyrtc = easyRTCMock(['p1', 'p2', 'p3'], ['nostream']);
    const participants = global.robotController.getRemoteParticipants();

    expect(participants).not.toEqual(expect.arrayContaining(['nostream']));
    expect(participants).toHaveLength(3);
  });

  test('should return the Streams of the participant', () => {
    const stream = global.robotController.getRemoteStream('p2');
    expect(stream.origin).toBe('p2');
  });

  test('should call listener on push events', () => {
    let eventFired = false;

    global.robotController.onAttendeePush = () => {
      eventFired = true;
    };

    expect(angular.registeredEvents).toHaveProperty('conferencestate:attendees:push');
    expect(eventFired).toBe(false);

    angular.registeredEvents['conferencestate:attendees:push']({});

    expect(eventFired).toBe(true);
  });

  test('should call listener on remove events', () => {
    let eventFired = false;

    global.robotController.onAttendeeRemove = () => {
      eventFired = true;
    };

    expect(angular.registeredEvents).toHaveProperty('conferencestate:attendees:remove');
    expect(eventFired).toBe(false);

    angular.registeredEvents['conferencestate:attendees:remove']({});

    expect(eventFired).toBe(true);
  });

  test('should call listener on update events', () => {
    let eventFired = false;

    global.robotController.onAttendeeUpdate = () => {
      eventFired = true;
    };

    expect(angular.registeredEvents).toHaveProperty('conferencestate:attendees:update');
    expect(eventFired).toBe(false);

    angular.registeredEvents['conferencestate:attendees:update']({});

    expect(eventFired).toBe(true);
  });

  test('should be disconnected on disconnect', () => {
    global.robotController.getDisconnectButton = () => {}; // Mock of hubl.in getDisconnectButton
    global.robotController.disconnect();
    expect(angular.disconnected).toBe(true);
  });
});
