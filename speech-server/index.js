import { writeFile, readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import slug from 'slug';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

const SPEECH_PATH = process.argv[4] || '../via-gustavo/speech';

const polly = new PollyClient({ region: 'us-east-1' });
console.info('Initialised Polly');
console.info('Using voice', process.argv[2]);

const getFileName = (text) => `${slug(text)}.mp3`;

const saveSpeech = (path, buffer) => {
  writeFile(path, buffer).then(() => console.info('Saved speech at', path));
};

const app = express();
app.use(bodyParser.text());
app.use(cors());

app.post('/speech', async (req, res) => {
  const text = req.body;
  console.info('Serving audio for', text);

  res.type('audio/mpeg');

  const fileName = getFileName(text);
  const path = join(SPEECH_PATH, fileName);
  const dir = await readdir(SPEECH_PATH);

  if (dir.includes(fileName)) {
    console.info('Serving from disk');
    return res.sendFile(resolve(path));
  }

  try {
    const options = {
      Text: text,
      VoiceId: process.argv[2] || 'Joanna',
      Engine: 'generative',
      OutputFormat: 'mp3',
      LanguageCode: process.argv[3] || 'en-US',
    };

    const { AudioStream } = await polly.send(new SynthesizeSpeechCommand(options));
    const bytes = await AudioStream.transformToByteArray();
    const buffer = Buffer.from(bytes.buffer);

    saveSpeech(path, buffer);

    return res.send(buffer);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send(err.message);
  }
});

app.listen(3000, () => console.info('Speech server runnning'));
