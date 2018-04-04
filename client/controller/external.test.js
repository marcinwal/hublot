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

/* global Object document */

Object.defineProperty(document, 'appendedElements', {
  value: []
});

Object.defineProperty(document, 'createElement', {
  value: type => {
    const res = {
      type,
      setAttribute: (k, v) => {
        res[k] = v;
      }
    };
    return res;
  }
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: e => {
      document.appendedElements.push(e);
    }
  }
});

describe('client/controller/external', () => {
  beforeEach(() => {
    global.robotController = {};

    /* eslint-disable import/no-unassigned-import */
    require('./external.js');
    /* eslint-enable */
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should add itself to controller', () => {
    expect(global.robotController.external).toBeDefined();
  });

  test('should load external libs in config', () => {
    global.robotController.external.load({
      externalLibs: ['dep1', 'dep2', 'dep3']
    });
    expect(document.appendedElements).toHaveLength(3);
    expect(document.appendedElements[0]).toEqual(expect.objectContaining({
      type: 'text/javascript',
      src: 'dep1'
    }));
    expect(document.appendedElements[1]).toEqual(expect.objectContaining({
      type: 'text/javascript',
      src: 'dep2'
    }));
    expect(document.appendedElements[2]).toEqual(expect.objectContaining({
      type: 'text/javascript',
      src: 'dep3'
    }));
  });
});
