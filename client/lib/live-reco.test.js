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

const sinon = require('sinon');

const robotLib = {};

function SockJS() {
  return {
    type: 'Sock'
  };
}

const StompclientMock = {
  connect: (f1, f2) => {
    f2();
  },
  send: jest.fn().mockImplementation(() => ({}))
};

const StompMock = {
  over: () => StompclientMock
};

const config = {
  reco: {
    host: 'localhost',
    port: 8080,
    reconnectInterval: 1000
  }
};
let xhr;
let request;
describe('client/lib/reco', () => {
  beforeEach(() => {
    request = [];

    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (req) {
      request.push(req);
    };
    global.robotLib = robotLib;
    global.Stomp = StompMock;
    global.SockJS = SockJS;

    /* eslint-disable import/no-unassigned-import */
    require('./live-reco.js');
    /* eslint-enable */
  });
  global.robotReco = {
    getRecommendation: id => ({type: 'Recommendation', id})
  };

  test('should define robotLib.reco', () => {
    expect(global.robotLib.reco).toBeDefined();
  });

  test('should make a correct REST call on start', () => {
    const confId = 'testConf';
    const urlExpected = 'http://localhost:8080/stream?action=START&id=' + confId;
    const reco = global.robotLib.reco(config);
    const result = reco.start(confId);
    expect(result).toBe(true);
    expect(request[0].method).toBe('GET');
    expect(request[0].url).toBe(urlExpected);
  });

  test('should make a correct REST call on stop', () => {
    const confId = 'testConf';
    const urlExpected = 'http://localhost:8080/stream?action=STOP&id=' + confId;
    const reco = global.robotLib.reco(config);
    reco.stop(confId);
    expect(request[0].method).toBe('GET');
    expect(request[0].url).toBe(urlExpected);
  });

  test('should make correct STOMP call when sending data', () => {
    const content = {
      data: 'testData'
    };
    const reco = global.robotLib.reco(config);
    reco.send(content);
    expect(StompclientMock.send).toHaveBeenCalledWith('/app/chat', {}, JSON.stringify(content));
  });
});
