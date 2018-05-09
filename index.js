#!/usr/bin/env node

'use strict';

const FONT_TO_USE = "Ubuntu-Condensed";
const FONT_COLOR = "white";
const FONT_SIZE = 27;
const IMAGEMAGICK_BINARY = (process.env.IMAGEMAGICK_BINARY || "convert").replace(/\\{2,}/g, "/");

// Replace Math.random() with MT-based substitute:
Math.random = require('./mt-rng');

const _ = require('lodash');
const os = require('os');
const path = require('path');
const exec = require('child-process-promise').exec;
const P = require('bluebird');
const fs = P.promisifyAll(require('fs'));
const request = P.promisifyAll(require('request'));
const wordfilter = require('wordfilter')
// Twitter interface
const creds = require('./credentials');
const Twit = require('twit');
Twit.prototype.postMediaChunkedAsync = P.promisify(Twit.prototype.postMediaChunked);
const REST = new Twit(creds.live);
// RiTaJS
const lex = new require('rita').RiLexicon();
const rw = lex.randomWord.bind(lex); // useful if you want to skip Wordnik
const isAdverb = lex.isAdverb.bind(lex);

const TMP_FILE = path.join(os.tmpdir(), 'this.png');

function isntAdverb(w) {
  if (_.words(w).length > 1) {
    return true;
  } else if (isAdverb(w)) {
    return false;
  } else {
    return true;
  }
}

function getRandomWord() {
  let target = `http://api.wordnik.com/v4/words.json/randomWord` + 
    `?includePartOfSpeech=noun&excludePartOfSpeech=adverb&minCorpusCount=3500&maxLength=12` +
    `&api_key=${creds.wordnik.api_key}`
  return request.getAsync({url: target, json: true}).
  then(res=>res.body.word);
}

function getRelatedWord(srcWord) {
  let target = `http://api.wordnik.com/v4/word.json/${srcWord}/relatedWords` +
    `?useCanonical=true&relationshipTypes=same-context&limitPerRelationshipType=40` +
    `&api_key=${creds.wordnik.api_key}`
  return request.getAsync({url: target, json: true}).
  then(res => _(res.body).flatMap("words").filter(isntAdverb).value() ).
  then(related => related.length < 1 ? getRandomWord() : _.sample(related)).
  then(related => {return {srcWord: srcWord, relWord: related}} );
}

function getWordPair() {
  return getRandomWord().
  then(srcWord => getRelatedWord(srcWord))
}

getWordPair().
  then(words => {
    if (_.isUndefined(words.relWord) || _.isUndefined(words.srcWord) || wordfilter.blacklisted(words.srcWord) || wordfilter.blacklisted(words.relWord) ) {
      return getWordPair()
    } else {
      return words
    }
  }).
  tap(console.log).
  then(words => {
    if (~os.platform().indexOf('win') ) {
      return `"${IMAGEMAGICK_BINARY}" ./isthis.png -font "${FONT_TO_USE}" -fill ${FONT_COLOR} -background none -pointsize ${FONT_SIZE} ( label:"${words.srcWord}" -rotate -8 -geometry +430+150 ) -composite ( label:"${words.relWord}" -geometry +310+430 ) -composite "${TMP_FILE}"`
    } else {
      return `${IMAGEMAGICK_BINARY} ./isthis.png -font "${FONT_TO_USE}" -fill ${FONT_COLOR} -background none -pointsize ${FONT_SIZE} \\( label:"${words.srcWord}" -rotate -8 -geometry +430+150 \\) -composite \\( label:"${words.relWord}" -geometry +310+430 \\) -composite "${TMP_FILE}"`
    }
  }).
  then(imCall => exec(imCall)).
  then(ret=>REST.postMediaChunkedAsync({file_path: TMP_FILE})).
  then(r=>REST.post('statuses/update', {
          status: '',
          media_ids: [r.media_id_string]
        })).
  then(res=>console.log(`ISTHIS twote:${res.data.id_str}`)).
  catch(console.error);