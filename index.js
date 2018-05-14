#!/usr/bin/env node
'use strict';

// Replace Math.random() with MT-based substitute:
Math.random = require('./lib/mt-rng');
// General requirements
const _ = require('lodash');
const P = require('bluebird');
const exec = require('child-process-promise').exec;
const os = require('os');
const path = require('path');
const fs = P.promisifyAll(require('fs'));
// Read API keys etc
const creds = require('./credentials');
// Twitter interface
const Twit = require('./lib/twithelper');
const T = new Twit(creds.live);
// For working with our words
const WordHelper = require('./lib/wordhelper');
const W = new WordHelper(creds);

// Settings/configuration
const FONT_TO_USE = "Ubuntu-Condensed";
const FONT_COLOR = "white";
const FONT_SIZE = 27;
const IMAGEMAGICK_BINARY = (process.env.IMAGEMAGICK_BINARY || "convert").replace(/\\{2,}/g, "/");
const TMP_FILE = path.join(os.tmpdir(), 'this.png');

function areRunningWindows() {
  return ~os.platform().indexOf('win')
}

function makeConvertCall(words) {
    if ( areRunningWindows() ) {
      return `"${IMAGEMAGICK_BINARY}" ./isthis.png -font "${FONT_TO_USE}" -fill ${FONT_COLOR} -background none -pointsize ${FONT_SIZE} ( label:"${words.srcWord}" -rotate -8 -geometry +430+150 ) -composite ( label:"${words.relWord}" -geometry +310+430 ) -composite "${TMP_FILE}"`
    } else {
      return `${IMAGEMAGICK_BINARY} ./isthis.png -font "${FONT_TO_USE}" -fill ${FONT_COLOR} -background none -pointsize ${FONT_SIZE} \\( label:"${words.srcWord}" -rotate -8 -geometry +430+150 \\) -composite \\( label:"${words.relWord}" -geometry +310+430 \\) -composite "${TMP_FILE}"`
    }
}

// srcOpts and relOpts are either objects with Wordnik params, or strings of each word to use
async function tweetMeme(srcOpts, relOpts, force) {
  let wordPair, convertCmd, convertRet, status, altText;

  wordPair = await W.getUsableWordPair(srcOpts, relOpts, force);

  // Fill in our tweet's text fields:
  status = ``;
  altText = `Cartoon man in glasses holding book looking at a butterfly labeled '${wordPair.srcWord}', asking "Is this ${wordPair.relWord}"`;

  // Construct the ImageMagick convert call, then run it to generate PNg at TMP_FILE
  convertCmd = makeConvertCall(wordPair);
  convertRet = await exec(convertCmd);

  console.log(`tweeting using ${JSON.stringify(wordPair)}`);
  // Now upload the image, assign its alt_text metadata then send the tweet, returning a Promise:
  return T.makeTweet(status, TMP_FILE, altText);
}

// Do it, supporting command line overrides:
let srcWord = process.argv[2];
let relWord = process.argv[3];
let force = !!process.argv[4];

tweetMeme(srcWord, relWord, force).
then(res=>console.log(`ISTHIS twote: ${res.data.id_str}`)).
catch(console.error);
