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

const puppeteer = require('puppeteer');

// Utility function to resolve a list of promise-based function calls
// on a given element list sequentially
function resolveSequentially(f, elements) {
  return elements.reduce(
    (acc, curr) => acc.then(() => f(curr)).catch(err => console.error(err)),
    new Promise(resolve => resolve()));
}

module.exports = config => {
  const b = puppeteer.launch(config.puppeteer);

  function displayClientConsole(page, room) {
    page.on('console', msg => {
      if (msg.type === 'error') {
        console.log('room', room, ':', '[' + msg.type + ']', msg.args[0].jsonValue());
      } else {
        console.log('room', room, ':', '[' + msg.type + ']', msg.text);
      }
    });

    page.on('warning', warn => {
      console.error('room', room, ':', '[WARN ' + warn.code + ']', warn.message);
      console.error('room', room, ':', warn.stack);
    });

    page.on('error', err => {
      console.error('room', room, ':', '[ERROR ' + err.code + ']', err.message);
      console.error('room', room, ':', err.stack);
    });

    page.on('pageerror', err => {
      console.error('room', room, ':', '[PAGEERROR]', err);
    });
  }

  return {
    run: async (controllerFilesList, server, room, clientConfig) => {
      try {
        const browser = await b;

        console.log('runner is up');

        const page = await browser.newPage();
        console.log('runner: client started');

        if (config.displayClientConsole) {
          displayClientConsole(page, room);
        }

        // Connect to the room

        await page.goto(server + '/' + room);
        console.log('runner: connecting to url');

        await page.waitForSelector('#displayname', {
          visible: true
        });
        console.log('runner: displayname visible');

        const nameField = await page.$('#displayname');

        // Clean field of possible old input
        await nameField.focus();
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');

        await nameField.type(clientConfig.name);
        const submitButton = await page.$('.btn');
        await submitButton.click();
        console.log('runner: name submitted');

        await page.$('#input_2');
        console.log('runner: display contact invitation');
        await page.waitFor(1000);
        await page.keyboard.press('Escape');
        console.log('runner: escape pressed');

        await page.waitForSelector('[video-id=video-thumb8]');
        console.log('runner: video exists');

        // Expose the room globally
        await page.evaluate(
          r => {
            room = r;
          },
          room);
        console.log('runner: room set');

        // Load the robot

        await resolveSequentially(
          source => page.evaluate(source),
          controllerFilesList);
        console.log('runner: modules resolved');

        await page.evaluate(
          clientConfig => {
            /* eslint-disable no-undef */
            robotController.external.load(clientConfig);
            /* eslint-enable */
          },
          clientConfig);
        console.log('runner: external loaded');

        // Run the robot

        await page.evaluate((room, clientConfig) => {
          setTimeout(
            () => {
              /* eslint-disable no-undef */
              robot.start(room, clientConfig);
              /* eslint-enable */
            },
            500);
        }, room, clientConfig);
        console.log('runner: robot started');

        return page;
      } catch (err) {
        console.error('runner: error ', err);
        return null;
      }
    }
  };
};
