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
const routesFactory = controllerFactory => {
  /* eslint new-cap: ["error", { "capIsNew": false }] */
  const routes = require('express').Router();

  const controller = controllerFactory;

  routes.put('/rooms/:room', (req, res) => {
    const result = controller.client(req.params.room);
    if (result) {
      res.status(201).json({message: 'Room ' + req.params.room + ' created'});
    } else {
      res.status(500).json({message: 'Unable to create Room ' + req.params.room});
    }
  });

  routes.delete('/rooms/:room', (req, res) => {
    const result = controller.forceDisconnect(req.params.room);
    if (result) {
      res.status(200).json({message: 'Room ' + req.params.room + ' deleted'});
    } else {
      res.status(404).json({message: 'Unable to delete Room : ' + req.params.room});
    }
  });

  return routes;
};

module.exports = {
  routesFactory
};
