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

function WebSocket() {
  return {
    type: 'Websocket'
  };
}

const robotLib = {};

const config = {gstreamerURL: 'ws://testurl'};

describe('client/lib/stt', () => {
  beforeEach(() => {
    global.robotLib = robotLib;
    global.WebSocket = WebSocket;
    /* eslint-disable import/no-unassigned-import */
    require('./speech-to-text.js');
    /* eslint-enable */
  });

  test('should define robotLib.stt', () => {
    expect(global.robotLib.stt).toBeDefined();
  });

  test('should return a Websocket on getTranscriptSocket', () => {
    const stt = global.robotLib.stt(config);
    const res = stt.getTranscriptSocket(() => {});
    expect(res.type).toBe('Websocket');
  });

  test('should call callback on valid segement', () => {
    const stt = global.robotLib.stt(config);
    const callback = jest.fn();
    const ws = stt.getTranscriptSocket(callback);

    const dataContent = {
      status: 0,
      result: {
        final: true,
        hypotheses: [
          {
            transcript: 'this is a transcript'
          }
        ]
      }
    };
    ws.onmessage({
      data: JSON.stringify(dataContent)
    });

    expect(callback).toHaveBeenCalled();
  });

  test('should call callback with actual transcript', () => {
    const stt = global.robotLib.stt(config);
    const callback = jest.fn();
    const ws = stt.getTranscriptSocket(callback);

    const dataContent = {
      status: 0,
      result: {
        final: true,
        hypotheses: [
          {
            transcript: 'this is a transcript'
          }
        ]
      }
    };

    ws.onmessage({
      data: JSON.stringify(dataContent)
    });

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: 'this is a transcript'
    }));
  });
  test('should not call callback with incorrect value of status', () => {
    const stt = global.robotLib.stt(config);
    const callback = jest.fn();
    const ws = stt.getTranscriptSocket(callback);

    const dataContent = {
      status: 1,
      result: {
        final: true,
        hypotheses: [
          {
            transcript: 'this is a transcript'
          }
        ]
      }
    };
    ws.onmessage({
      data: JSON.stringify(dataContent)
    });

    expect(callback).not.toHaveBeenCalled();
  });
  test('should not call callback when transcription is not final', () => {
    const stt = global.robotLib.stt(config);
    const callback = jest.fn();
    const ws = stt.getTranscriptSocket(callback);

    const dataContent = {
      status: 0,
      result: {
        final: false,
        hypotheses: [
          {
            transcript: 'this is a transcript'
          }
        ]
      }
    };
    ws.onmessage({
      data: JSON.stringify(dataContent)
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
