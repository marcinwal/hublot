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
const config = {
  archive: 'http://openpaasstore.test/summary'
};

let xhr;
let request;

let users;
let text;
let keywords;

describe('client/lib/archive when status server is valide', () => {
  beforeEach(() => {
    request = [];
    users = ['userTest@open-paas.org'];
    text = 'Transcription Text';
    keywords = [{
      key: 'keyTest',
      value: 'testValue'
    }];

    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (req) {
      req.status = 200;
      request.push(req);
    };

    global.robotLib = robotLib;

    /* eslint-disable import/no-unassigned-import */
    require('./archive.js');
    /* eslint-enable */
    global.archive = global.robotLib.archive(config);
  });

  afterEach(() => {
    xhr.restore();
  });

  it('should define robotLib.archive', () => {
    expect(global.robotLib.archive).toBeDefined();
  });

  it('should make a correct REST call', () => {
    const result = global.archive.store(users, text, keywords);
    expect(result).toBe(true);
  });

  it('should not make a REST call on store without parameters', () => {
    const result = global.archive.store();
    expect(result).toBe(false);
    expect(request[0]).toBe(undefined);
  });

  it('should not make a REST call on store users is undefined', () => {
    users = undefined;
    const result = global.archive.store(users, text, keywords);
    expect(result).toBe(false);
    expect(request[0]).toBe(undefined);
  });

  it('should not make a REST call on store text is undefined', () => {
    text = undefined;
    const result = global.archive.store(users, text, keywords);
    expect(result).toBe(false);
    expect(request[0]).toBe(undefined);
  });

  it('should not make a REST call on store when keywords are undefined', () => {
    keywords = undefined;
    const result = global.archive.store(users, text, keywords);
    expect(result).toBe(false);
    expect(request[0]).toBe(undefined);
  });

  it('should not make a REST call on store when keywords is not an Array', () => {
    keywords = 'invalidFormat';
    const result = global.archive.store(users, text, keywords);
    expect(result).toBe(false);
    expect(request[0]).toBe(undefined);
  });

  it('should not make a REST call on store when users is not an Array', () => {
    users = '';
    const result = global.archive.store(users, text, keywords);
    expect(result).toBe(false);
    expect(request[0]).toBe(undefined);
  });
});
