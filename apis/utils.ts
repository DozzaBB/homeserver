import express from 'express';
import logger from '../logging.ts';
import {exec} from 'child_process'
const router = express.Router();

router.get("/restart", (req, res) => {
  logger.info("restart received");
  res.send();
  process.exit(); //systemd will autorestart this.
  // execSync('systemctl reboot');
})

const allowed_programs = [
  'vlc',
  'pia-client',
  'handbrake',
]

router.get("/kill/:program", (req, res) => {
  if (allowed_programs.includes(req.params.program)) {
    logger.info("Pkill...")
    exec(`pkill -f ${req.params.program}`);
    res.send();

  } else {
    res.status(400).send("Program not allowed");
  }
})

export default router;