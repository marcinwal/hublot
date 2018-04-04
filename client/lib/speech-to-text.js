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

/* global robotLib:true WebSocket */

robotLib.stt = function (config) {
  return {
    getTranscriptSocket: onSegment => {
      try {
        const ws = new WebSocket(config.gstreamerURL);
        ws.addEventListener('open', () => {
          console.info('ws to stt module open');
        });
        ws.onclose = function () {
          console.info('ws to stt module closed');
        };
        ws.addEventListener('error', event => {
          console.info('ws to stt module error: ' + event);
        });
        ws.addEventListener('message', event => {
          const hyp = JSON.parse(event.data);
          if (hyp.status === 0) {
            if (hyp.result !== undefined && hyp.result.final) {
              const trans = ((hyp.result.hypotheses)[0]).transcript;
              let start;
              let end;
              if (hyp['segment-start'] && hyp['segment-length']) {
                start = JSON.parse(hyp['segment-start']);
                end = parseFloat(hyp['segment-start']) + parseFloat(hyp['segment-length']);
              } else {
                const time = new Date().getTime() / 1000;
                start = time;
                end = time + 1;
              }

              onSegment({
                from: start,
                until: end,
                text: trans
              });
            }
          }
        });
        return ws;
      } catch (err) {
        console.error(err);
        return null;
      }
    }
  };
};
