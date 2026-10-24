import express from 'express';
import mediaRouter from './apis/media.ts';
import utilsRouter from './apis/utils.ts'
import cors from 'cors';

import logger from './logging.ts';
logger.info("Starting...")

import path from 'path';
const app = express();
app.use(cors());
const port = 3000;


// Serve static files from the 'build' directory
app.use(express.static(path.join(import.meta.dirname, 'client/dist')));

// Define API routes (optional, if your backend also serves an API)
app.use('/media', mediaRouter);
app.use('/utils', utilsRouter);

// Handle all other routes by serving the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(import.meta.dirname, 'client/dist', 'index.html'));
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`)
})