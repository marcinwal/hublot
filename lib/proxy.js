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

const http = require('http');
const SockJS = require('sockjs-client');
const stomp = require('webstomp-client');
const WebSocket = require('ws');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

module.exports = config => {
  function createStompClient() {
    const stompCapsule = {
      get: null
    };

    function tryConnect() {
      console.log('proxy: connecting to STOMP...');

      const sock = new SockJS('http://' + config.services.reco.host + ':' + config.services.reco.port + '/chat');
      stompCapsule.get = stomp.over(sock, {
        debug: false
      });

      stompCapsule.get.connect(
        {},
        () => console.log('proxy: STOMP connected'),
        err => {
          console.error(
            'proxy: STOMP failed to connect to %s:%s (trying again in %d ms)',
            config.services.reco.host, config.services.reco.port, config.services.reco.reconnectInterval);
          console.error(err);
          setTimeout(tryConnect, config.services.reco.reconnectInterval);
        });
    }
    tryConnect();

    return stompCapsule;
  }

  function kaldiWS(connectionToClient, resume) {
    const connectionToKaldi = new WebSocket(config.services.kaldi);
    connectionToKaldi.on('open', () => {
      const streamData = resume.generateStream();

      connectionToClient.on('message', message => {
        connectionToKaldi.send(message, {
          binary: true
        });
        streamData.wstream.write(message);
      });

      connectionToKaldi.on('message', message => {
        try {
          connectionToClient.send(message);
        } catch (err) {
          // Sometimes, the client will close the connection unexpectedly
          // (e.g. when stopping). This is expected
        }
      });

      connectionToClient.on('close', () => connectionToKaldi.close());
      connectionToKaldi.on('close', () => {
        resume.endStream(streamData)
        connectionToClient.close()
      });
    });
  }

  function recoChatWS(connectionToClient, stompClient) {
    connectionToClient.on('message', message => {
      try {
        stompClient.get.send('/app/chat', message);
      } catch (err) {
        console.error('proxy: chatWS', err);
      }
    });

    connectionToClient.on('error', error => {
      console.error('proxy: WS chat error', error);
    });
  }

  function recoStartStopWS(connectionToClient) {
    connectionToClient.on('message', message => {
      const xmlHttp = new XMLHttpRequest();
      const url = 'http://' + config.services.reco.host + ':' + config.services.reco.port + message;
      xmlHttp.open('GET', url, true);
      xmlHttp.setRequestHeader('Content-type', 'application/json');
      xmlHttp.send(null);

      connectionToClient.close();
    });

    connectionToClient.on('error', error => {
      console.error('proxy: WS reco error', error);
    });
  }

  function recoRecoWS(connectionToClient) {
    connectionToClient.on('message', message => {
      const xmlHttp = new XMLHttpRequest();

      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4) {
          if (xmlHttp.status === 200) {
            try {
              connectionToClient.send(xmlHttp.responseText);
            } catch (err) {
              console.error('proxy: recoRecoWS error', err);
            }
          } else {
            console.error('Online reco: error trying to reach http://%s:%s/resources',
                          config.services.reco.host, config.services.reco.port);
          }
          connectionToClient.close();
        }
      };

      const url = 'http://' + config.services.reco.host + ':' + config.services.reco.port + message;
      xmlHttp.open('GET', url, true);
      xmlHttp.setRequestHeader('Content-type', 'application/json');
      xmlHttp.send(null);
    });

    connectionToClient.on('error', error => {
      console.error('proxy: WS reco error', error);
    });
  }

  return {
    create: (resume) => {
      resume.createFolder()

      const server = http.createServer();

      const stompClient = createStompClient();

      const wssServer = new WebSocket.Server({
        server,
        autoAcceptConnections: true
      });

      wssServer.on('connection', (connectionToClient, req) => {
        if (req.url === '/kaldi') {
          kaldiWS(connectionToClient, resume);
          return;
        }
        if (req.url === '/chat') {
          recoChatWS(connectionToClient, stompClient);
          return;
        }
        if (req.url === '/startstop') {
          recoStartStopWS(connectionToClient);
          return;
        }
        if (req.url === '/reco') {
          recoRecoWS(connectionToClient);
          return;
        }
        console.error('proxy: unknown path for ws connection', req.url);
      });

      server.listen(config.port);

      console.log('Proxy listening on port', config.port);
    }
  };
};
