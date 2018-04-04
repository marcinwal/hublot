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

const fs = require('mz/fs');

module.exports = root => {
  const controller = {
    load: module => new Promise((resolve, reject) => {
      // First we read the file with the same name than the folder
      fs.readFile(root + '/' + module + '/' + module + '.js', 'utf8')
        .then(content => {
          // Then we read all the other files in the folder
          fs.readdir(root + '/' + module)
            .then(files => {
              // Remove the file we already read
              files.splice(files.indexOf(module + '.js'), 1);

              // Ignore test files
              files = files.filter(filename => !filename.endsWith('.test.js'));

              Promise.all(files.map(
                f => fs.readFile(root + '/' + module + '/' + f, 'utf8')
              ))
                .then(contents => {
                  // Concatenate all the files and resolve
                  resolve([content].concat(contents));
                })
                .catch(err => {
                  reject(err);
                });
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
          reject(err);
        });
    }),

    loadAll: (...modules) => new Promise((resolve, reject) => {
      // Load all the passed modules
      Promise.all(
        modules.map(f => controller.load(f)))
        .then(values => {
          // Concatenate all the arrays into a single one
          resolve(Array.prototype.concat.apply([], values));
        }).catch(err => {
          reject(err);
        });
    })
  };

  return controller;
};
