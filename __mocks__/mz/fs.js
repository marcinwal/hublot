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

/**
 * This file defines a mock for the mz/fs lib.
 *
 * It allows us to mock filesystem access during tests.
 *
 * To use it, call the `__setup` method before your tests and pass it a
 * dictionary of { "filepath": "content"} that represent the filesystem to mock.
 *
 */

const path = require('path');

const fs = jest.genMockFromModule('mz/fs');

let mockFiles = Object.create(null);

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `moz/fs` APIs are used.
fs.__setup = function (newMockFiles) {
  mockFiles = newMockFiles;
};

fs.readFile = function (filePath) {
  if (Object.keys(mockFiles).includes(filePath)) {
    return Promise.resolve(mockFiles[filePath]);
  }
  return Promise.reject(new Error('no such file or directory'));
};

fs.readdir = function (dirPath) {
  const res = Object.keys(mockFiles)
        .filter(f => path.dirname(f) === dirPath)
        .map(f => path.basename(f));
  if (res.length !== 0) {
    return Promise.resolve(res);
  }
  return Promise.reject(new Error('no such file or directory'));
};

module.exports = fs;
