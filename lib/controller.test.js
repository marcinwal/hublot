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

const {create} = require('./controller.js');

// Here are some needed mocks

global.robot = {
  stopCalled: false,
  stop: () => {
    global.robot.stopCalled = true;
  }
};

function mockClient() {
  const res = {
    exposedFunctions: {},
    exposeFunction: (name, f) => {
      res.exposedFunctions[name] = f;
    },
    evaluate: f => {
      f();
    },
    close: () => {}
  };
  return res;
}

const runnerMock = {
  exposedFunction: {},
  run: async () => {
    return mockClient();
  }
};

const configMock = {
  visio: {url: 'someurl.test'},
  client: {}
};

let controller;

describe('controller', () => {
  beforeEach(() => {
    global.robot.stopCalled = false;
    controller = create(runnerMock, [], configMock);
  });

  test('should allow to create a client to a new room', () => {
    expect(controller.client).toBeDefined();
  });

  test('should register a newly created client to its room', async done => {
    const client = await controller.client('test');
    expect(controller.registry).toHaveProperty('test', client);
    done();
  });

  test('should return null when trying to create a client for an existing room', async done => {
    await controller.client('test');
    const client2 = await controller.client('test');
    expect(client2).toBeNull();
    done();
  });

  test('should not replace the client for an existing room', async () => {
    const client1 = await controller.client('test');
    await controller.client('test');
    expect(controller.registry).toHaveProperty('test', client1);
  });

  test('should execute robot.stop() when the client is disconnect', async () => {
    await controller.client('test');
    expect(global.robot.stopCalled).toBe(false);
    controller.forceDisconnect('test');
    expect(global.robot.stopCalled).toBe(true);
  });

  test('should have registered a finish callback to the client', async () => {
    const client = await controller.client('test');
    expect(client.exposedFunctions).toHaveProperty('notifyEndToServer');
    expect(client.exposedFunctions.notifyEndToServer).not.toBeNull();
  });

  test('should clean registry on client finish callback', async () => {
    const client = await controller.client('test');
    expect(controller.registry).toHaveProperty('test');
    client.exposedFunctions.notifyEndToServer();
    expect(controller.registry).not.toHaveProperty('test');
  });
});
