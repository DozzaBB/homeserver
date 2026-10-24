import { exec } from 'child_process';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import express from 'express';
import logger from '../logging.ts';
import dnssd from 'dnssd';
import db from '../db.ts';
import { Client, DefaultMediaReceiver, MediaController } from 'castv2-client';
import { config } from '../secrets.ts';


const VLC_PATH = config.VLC_PATH;
let chromecastData: {name?: string, ip?: string} = {};
const ALLOWED_FILES = ["mp4", "mkv", "avi"];
let globalplayer: MediaController;

// Google AI did this one.. no docs!
async function* getFiles(dir: string): any {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* getFiles(fullPath); // Recurse into directory and yield its files
    } else {
      yield fullPath; // Yield the file path
    }
  }
}

function createChromecast(ip: string) {
  if (ip === '') {
    return logger.error('No IP Provided for Chromecast creation');
  }
  const client = new Client();
  client.connect(ip, () => {
    client.launch(DefaultMediaReceiver, (err, player) => {
      globalplayer = player;
      logger.info('Chromecast client found and connected to.');
    });
  });
}

function findChromecast() {
  db.write();
  // get chromecast IP.
  logger.info("looking for chromecast...");
  const browser: dnssd.Browser = new dnssd.Browser(dnssd.tcp('googlecast'))
    .on('serviceUp', service => {
      // check if its audio only.
      logger.info("Got serviceUp signal...");
      if (service.txt.md === 'Chromecast') {
        console.log("Device up: ", service);
        chromecastData.name = service.txt.fn
        chromecastData.ip = service.addresses.at(0);
        logger.info("Chromecast IP was " + chromecastData.ip);
        // create client etc from the IP.
        // createChromecast(chromecastData.ip ?? '');
      
      } else {
        logger.info("Found non-audio device, ignoring: " + service?.txt?.md);
        return;
      }
    })
    .on('serviceDown', service => console.log("Device down: ", service))
    .start();
}

findChromecast();

const router = express.Router();

// needs sudo..
// api.get("/shutdown", (req, res) => {
//   logger.info("shutdown received");
//   let a = execSync('systemctl');
//   logger.info("Shutdown finished");
//   logger.info(a);
//   res.send();
// })



router.get('/files', async (req, res) => {
  const a: string[] = [];
  for await (const file of getFiles(config.SHOWS_DIR)) {
    const filetype = file.split(".").at(-1);
    if (ALLOWED_FILES.includes(filetype)) {
      a.push(file);
    }
  }
  res.json({
    files: a,
    chromecastData,
    watched: db.data.watched,
    hiddenTerms: db.data.hiddenTerms
  });
});

router.get('/addhiddenterm', (req, res) => {
  if (!req.query.term) { return res.status(404).send('no term!') }
  const term = String(req.query.term);
  logger.info('Adding hidden term:');
  logger.info(term)
  if (!term || term === '') {
    logger.error('missing term');
    return res.status(400).send('Missing term');
  }
  (db.data.hiddenTerms as string[]).push(term.toUpperCase());
  db.write();
  res.send("worked");
});

router.get('/ffprobe', (req, res) => {
  if (!req.query.filename) { return res.status(404).send('no file!') }
  const filename = String(req.query.filename);
  logger.info('ffprobe:');
  logger.info(filename)
  if (!filename || filename === '') {
    logger.error('missing filename');
    return res.status(400).send('Missing filename');
  }
  console.log(`ffprobe -v error -print_format json -show_format -show_streams "${filename}"`);
  exec(`ffprobe -v error -print_format json -show_format -show_streams "${filename}"`, (err, stdout, stderr) => {
    if (err) {
      logger.error("ffprobe error:");
      logger.error(err);
      return res.status(500).send('ffprobe error');
    }
    res.send(stdout);
  });
});


router.get('/play', (req, res) => {
  if (!req.query.filename) { return res.status(404).send('no file!') }
  const filename = String(req.query.filename);
  const starttime = req.query.starttime;
  const audioIndex = req.query.audioindex;
  logger.info('Playing:');
  logger.info(filename)
  if (!filename || filename === '') {
    logger.error('missing filename');
    return res.status(400).send('Missing filename');
  }
  res.send("worked");
  let toExec = '';
  toExec += `${VLC_PATH} "${filename}"`;

  // disable for dev mode.
  toExec += ` --sout '#chromecast' --sout-chromecast-ip=${chromecastData.ip} --demux-filter=demux_chromecast`;
  
  if (audioIndex) {
    toExec += ` --audio-track-id=${audioIndex}`;// audio track id is the stream->index rather than the array position.
  }

  if (starttime) {
    toExec += ` --start-time=${starttime}`;
  }
  // Cant figure out how to get --one-process working
  exec('pkill -f vlc');
  logger.info("Killed VLC");
  setTimeout(() => {
    exec(toExec, (err, stdout, stderr) => {
      logger.info("Finished, stdout:")
      logger.info(stdout);
      logger.info("Stderr:")
      logger.error(stderr);
    });
  }, 1000);
  db.data.watched[filename] = new Date().toISOString();
  db.write();
});

router.get('/markwatched', (req, res) => {
  if (!req.query.filename) { return res.status(404).send('no file!') }
  const filename = String(req.query.filename);
  logger.info('mark watched:');
  logger.info(filename)
  if (!filename || filename === '') {
    logger.error('missing filename');
    return res.status(400).send('Missing filename');
  }
  res.send("worked");
  db.data.watched[filename] = new Date().toISOString();
  db.write();
});

router.get('/handbrake', (req, res) => {
  if (!req.query.filename) { return res.status(404).send('no file!') }
  const filename = req.query.filename;
  logger.info('Playing:');
  logger.info(filename)
  res.send("worked");
  exec(`${VLC_PATH} "${filename}" --sout '#chromecast' --sout-chromecast-ip=${chromecastData.ip} --demux-filter=demux_chromecast`, (err, stdout, stderr) => {
    logger.info(stdout);
    logger.error(stderr);
  });
});

router.post('/chromecast/:command', (req, res) => {
  logger.info('chromecast command received: ' + req.params.command);
  // logger.info(req.params.command);
  // console.log(req.params);
  if (!globalplayer) {
    logger.error('No player currently attached');
    return res.status(404).send('No player currently attached');
  }
  switch (req.params?.command) {
    case 'pause':
      globalplayer.pause();
      break;
    case 'play':
      globalplayer.play();
      break;
    case 'forward':
      globalplayer.getStatus((err, status) => {
        globalplayer.seek(status.currentTime + 30);
      });
      break;
    case 'backward':
      globalplayer.getStatus((err, status) => {
        globalplayer.seek(status.currentTime - 30);
      });
      globalplayer.play();
      break;
    case 'status':
      globalplayer.getStatus((err, status) => {
        res.json(status);
      });
      return;
    default:
      logger.error('Unknown command: ' + req.params?.command);
      return res.status(400).send('Unknown command');
    }
    return res.send('OK');
})


export default router;