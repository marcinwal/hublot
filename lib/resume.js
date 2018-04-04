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
const fs = require('fs');
const uuidv1 = require('uuid/v1');

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller  = require('@ffprobe-installer/ffprobe');


const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

module.exports = ffmpeg;

module.exports = config => {

  let timestamp = undefined;

  return {
    createFolder : () => {
      if (!fs.existsSync(config.folder.audioRaw)) {
        fs.mkdirSync(config.folder.audioRaw);
      }
      if (!fs.existsSync(config.folder.audio)) {
        fs.mkdirSync(config.folder.audio);
      }
    },
    generateStream : () => {
      if(timestamp === undefined){
        timestamp = new Date().getTime()
      }
      const name = uuidv1()
      const path = config.folder.audioRaw+"/"+name+".wav"
      const streamData = {
        "wstream" : fs.createWriteStream(path),
        "pathFile" : path,
        "fileName": name,
        "timestamp" : new Date().getTime()
      }
      return streamData
    },
    
    endStream : (streamData) => {
      const toSecond = 1000
      streamData.wstream.close();
      let delay = ((timestamp - streamData.timestamp) / toSecond) * -1;
      try{
        //var silence = ffmpeg().input('anullsrc=sample_rate=16000').inputFormat('lavfi').duration(delay).output(config.folder.audio+"/silence_"+streamData.fileName+".wav").run();
        //var stream = ffmpeg(streamData.pathFile).toFormat(config.audio.format).noVideo().audioBitrate(config.audio.bitrate).audioChannels(config.audio.channels).audioFrequency(config.audio.srate).save(config.folder.audio+"/"+streamData.fileName+".wav")

        ffmpeg()
        .input('anullsrc=sample_rate='+config.audio.srate)
        .inputFormat('lavfi')
        .duration(delay)
        .output(config.folder.audio+"/silence_"+streamData.fileName+".wav")
        .on('end', function() {
          
          ffmpeg(streamData.pathFile)
          .toFormat(config.audio.format)
          .noVideo()
          .audioBitrate(config.audio.bitrate)
          .audioChannels(config.audio.channels)
          .audioFrequency(config.audio.srate)
          .save(config.folder.audio+"/"+streamData.fileName+".wav")
          .on('end', function() {
            ffmpeg()
            .input(config.folder.audio+"/silence_"+streamData.fileName+".wav")
            .input(config.folder.audio+"/"+streamData.fileName+".wav")

            .on('error', function(err) {
              console.log('An error occurred: ' + err.message);
            })
            .on('end', function() {
              console.log('Merging finished !');
            })

            .mergeToFile(config.folder.audioMerged+"/"+streamData.fileName+".wav", config.folder.audio)
          
          })
        })
        .run()

        
        /*
        ffmpeg(streamData.pathFile)
            .toFormat(config.audio.format)
            .noVideo()
            .audioBitrate(config.audio.bitrate)
            .audioChannels(config.audio.channels)
            .audioFrequency(config.audio.srate)
            .save(config.folder.audio+"/"+streamData.fileName+".wav")*/
      } catch(err){
        // Sometimes, the client will close the connection unexpectedly
        // (e.g. when stopping). This is expected
      }
    }
  };
};
