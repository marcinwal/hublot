
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

// Module to control the server-side behavior and state

const create = (runner, modules, config) => {
  const controller = {
    registry: {},
    client: async room => {
      if (room in controller.registry) {
        return null;
      }

      controller.registry[room] = await runner.run(modules,
        config.visio.url,
        room,
        config.client);

      // Add callback for client to inform when it leaves the room
      registerClientEndCallback(room);

      return controller.registry[room];
    },

    forceDisconnect: room => {
      if (!controller.registry[room]) {
        return false;
      }
      controller.registry[room].evaluate(() => {
        /* eslint-disable no-undef */
        robot.stop();
        /* eslint-enable */
      });
      // Client-side `robot.stop` will call `registerClientEndCallback`
      // callback to clean registry
      return true;
    }
  };

  function registerClientEndCallback(room) {
    controller.registry[room].exposeFunction(
      'notifyEndToServer',
      () => {
        controller.registry[room].close();
        delete controller.registry[room];
        console.log('client for room', room, 'finished');
      });
  }

  return controller;
};

module.exports = {
  create
};
