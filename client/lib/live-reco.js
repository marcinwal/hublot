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

/* global robotLib:true Stomp SockJS XMLHttpRequest WebSocket */

robotLib.reco = function (config) {
  let recoStompClient;
  let connected = false;

  function connectionHandler() {
    const connection = {
      getReco: (confId, resolve, reject) => {
        const xmlHttp = new XMLHttpRequest();

        xmlHttp.onreadystatechange = () => {
          if (xmlHttp.readyState === 4) {
            if (xmlHttp.status === 200) {
              resolve(xmlHttp.responseText);
            } else {
              console.error('Online reco: error trying to reach http://%s:%s/resources', config.reco.host, config.reco.port);
              reject(xmlHttp.statusText);
            }
          }
        };

        const url = 'http://' + config.reco.host + ':' + config.reco.port + '/resources?id=' + confId + '&resources=keywords;wiki';
        xmlHttp.open('GET', url, true);
        xmlHttp.setRequestHeader('Content-type', 'application/json');
        xmlHttp.send(null);
      },

      send: data => {
        recoStompClient.send('/app/chat', {}, data);
      },

      start: confId => {
        const xhttp = new XMLHttpRequest();
        xhttp.open('GET', 'http://' + config.reco.host + ':' + config.reco.port + '/stream?action=START&id=' + confId, false);
        xhttp.send();
      },

      stop: confId => {
        const xhttp = new XMLHttpRequest();
        xhttp.open('GET', 'http://' + config.reco.host + ':' + config.reco.port + '/stream?action=STOP&id=' + confId, false);
        xhttp.send();
      },

      tryConnect: () => {
        recoStompClient = Stomp.over(new SockJS('http://' + config.reco.host + ':' + config.reco.port + '/chat'));
        recoStompClient.connect(
          {},
          () => {
            connected = true;
          },
          err => {
            connected = false;

            console.error('Online reco: STOMP failed to connect to',
              config.reco.host, ':', config.reco.port,
              '(trying again in', config.reco.reconnectInterval, 'ms)');
            console.error('Online reco: ' + err);
            setTimeout(connection.tryConnect, config.reco.reconnectInterval);
          });
      }
    };

    return connection;
  }

  function proxifiedConnectionHandler() {
    const connection = {
      getReco: (confId, resolve, reject) => {
        const ws = new WebSocket('ws://' + config.reco.host + ':' + config.reco.port + '/reco');
        ws.addEventListener('open', () => {
          ws.send('/resources?id=' + confId + '&resources=keywords;wiki');
        });
        ws.addEventListener('error', event => {
          reject(event);
        });
        ws.addEventListener('message', event => {
          ws.close();
          resolve(event.data);
        });
      },

      send: data => {
        recoStompClient.send(data);
      },

      start: confId => {
        const ws = new WebSocket('ws://' + config.reco.host + ':' + config.reco.port + '/startstop');
        ws.addEventListener('open', () => {
          ws.send('/stream?action=START&id=' + confId);
          ws.close();
        });
      },

      stop: confId => {
        const ws = new WebSocket('ws://' + config.reco.host + ':' + config.reco.port + '/startstop');
        ws.addEventListener('open', () => {
          ws.send('/stream?action=STOP&id=' + confId);
          ws.close();
        });
      },

      tryConnect: () => {
        const ws = new WebSocket('ws://' + config.reco.host + ':' + config.reco.port + '/chat');

        ws.addEventListener('open', () => {
          connected = true;
        });
        ws.onclose = function () {
          connected = false;
        };
        ws.addEventListener('error', () => {
          setTimeout(connection.tryConnect, config.reco.reconnectInterval);
        });
        recoStompClient = ws;
      }
    };

    return connection;
  }

  function createConnection() {
    if (config.proxified) {
      return proxifiedConnectionHandler();
    }
    return connectionHandler();
  }

  const connection = createConnection();

  connection.tryConnect();

  return {
    start: confId => {
      if (!connected) {
        console.error('Online reco: not connected but trying to send start to conf %s', confId);
        return false;
      }
      connection.start(confId);
      return true;
    },

    stop: confId => {
      if (!connected) {
        console.error('Online reco: not connected but trying to send stop to conf %s', confId);
        return false;
      }
      connection.stop(confId);
      return true;
    },

    send: content => {
      if (!connected) {
        console.error('Online reco: not connected but trying to send %j', content);
        return false;
      }
      connection.send(JSON.stringify(content));
      return true;
    },

    getOnlineReco: confId => {
      return new Promise((resolve, reject) => {
        connection.getReco(confId, resolve, reject);
      });
    }
  };
};
