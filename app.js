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
const app = require('express')();
const routes = require('./lib/webserver/routes');

const config = require('./config.json');

const runner = require('./lib/runner.js')(config.runner);
const loader = require('./lib/loader.js')('./client');
const controllerFactory = require('./lib/controller.js');

const proxy = require('./lib/proxy.js')(config.proxy);
const resumeGenerator = require('./lib/resume.js')(config.offline)

console.log('starting hublot...');

loader.loadAll('controller', 'lib', 'robot')
  .then(modules => {
    console.log('modules loaded... creating controller');

    const controller = controllerFactory.create(runner, modules, config);
    console.log('creating client');
    // Automatic way use : controller.client('test-bot');

    app.use('/', routes.routesFactory(controller));
    app.listen(config.api, () => {
      console.log('App listening on port 3000');
    });

    proxy.create(resumeGenerator);
  })
  .catch(err => {
    console.error(err);
  });

// Hang
(function wait() {
  setTimeout(wait, 10000);
})();
