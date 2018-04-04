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

/* global robotLib:true XMLHttpRequest */
/* exported robotController */

function isValidTranscript(users, text, keywords) {
  return !((users === undefined || users.constructor !== Array) || text === undefined || (keywords === undefined || keywords.constructor !== Array));
}
robotLib.archive = function (config) {
  return {
    store(users, text, keywords) {
      if (!isValidTranscript(users, text, keywords)) {
        return false;
      }

      const xhttp = new XMLHttpRequest();
      xhttp.open('POST', config.archive);
      xhttp.setRequestHeader('Content-Type', 'application/json');
      const transcript = {
        text,
        keywords,
        users
      };
      xhttp.send(JSON.stringify(transcript));
      return true;
    }
  };
};
