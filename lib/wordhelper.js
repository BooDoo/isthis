#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const P = require('bluebird');
const qs = require('querystring');
const wordfilter = require('wordfilter');
const lex = new require('rita').RiLexicon();
const rw = lex.randomWord.bind(lex); // useful if you want to skip Wordnik
const isAdverb = lex.isAdverb.bind(lex);
const request = P.promisifyAll(require('request'));

const WORDNIK_PREFIX = 'http://api.wordnik.com/v4';

class WordHelper {

  constructor(creds) {
    let wordnikApiKey;

    // Take wordnik api key as string, as creds.wordnik, or as creds.wordnik.api_key
    if ( _.isString(creds) ) {
      wordnikApiKey = creds;
    } else {
      wordnikApiKey = _.hasIn(creds, 'wordnik') ? creds.wordnik.api_key || creds.wordnik : null;
    }

    if (wordnikApiKey) {
      this.wordnik = {apiKey: wordnikApiKey};
    } else {
      console.warn("No API Key given for Wordnik!");
      this.wordnik = null;
    }
  }
};

WordHelper.prototype.isAdverb = isAdverb;
WordHelper.prototype.blacklisted = wordfilter.blacklisted;

WordHelper.prototype.isntAdverb = function isntAdverb(w) {
  if (_.words(w).length > 1) {
    return true;
  } else if (isAdverb(w)) {
    return false;
  } else {
    return true;
  }
};

WordHelper.prototype.isUsableWord = function isUsableWord(w) {
  // console.log(`checking ${w}`);
  return !(_.isUndefined(w) || wordfilter.blacklisted(w));
};

WordHelper.prototype.isUsableWordPair = WordHelper.prototype.areUsableWords = function areUsableWords(words) {
  return _.every(words, this.isUsableWord);
};

WordHelper.prototype.getRandomWord = function getRandomWord(opts) {
  // Punt to RiTa if we have no Wordnik API key
  if (this.wordnik == null) {
    return P.resolve(rw())
  }

  opts = _(opts).defaults({
    includePartOfSpeech: "noun",
    excludePartOfSpeech: "adverb",
    minCorpusCount: 3500,
    maxLength: 12,
    api_key: this.wordnik.apiKey
  }).
  transform((res,v,k)=> res[k] = _.isArray(v) ? v.join(',') : v).value();

  let target = `${WORDNIK_PREFIX}`;
  target += `/words.json/randomWord?`;
  target += qs.stringify(opts);
  // console.log(`calling: ${target}`);

  return request.getAsync({url: target, json: true}).
  then(res=>res.body.word);
};

WordHelper.prototype.getSecondWord = function getSecondWord(srcWord, opts) {
  srcWord = srcWord || rw();
  // Punt to RiTa if we have no Wordnik API key
  if (this.wordnik == null) {
    return P.resolve(rw())
  }

  opts = _(opts).defaults({
    useCanonical: true,
    relationshipTypes: 'same-context',
    limitPerRelationshipType: 40,
    api_key: this.wordnik.apiKey
  }).
  transform((res,v,k)=> res[k] = _.isArray(v) ? v.join(',') : v).value();

  let target = `${WORDNIK_PREFIX}`;
  target += `/word.json/${srcWord}/relatedWords?`;
  target += qs.stringify(opts);
  // console.log(`calling: ${target}`);

  return request.getAsync({url: target, json: true}).
  then(res => _(res.body).flatMap("words").filter(this.isntAdverb).value() ).
  then(candidates => candidates.length < 1 ? this.getRandomWord() : _.sample(candidates))
};

WordHelper.prototype.getWordPair = async function getWordPair(srcOpts, relOpts) {
  let srcWord = (_.isString(srcOpts)) ? srcOpts : await this.getRandomWord(srcOpts);
  let relWord = (_.isString(relOpts)) ? relOpts : await this.getSecondWord(srcWord, relOpts);
  return P.resolve({srcWord: srcWord, relWord: relWord});
};

WordHelper.prototype.getUsableWordPair = function getUsableWordPair(srcOpts, relOpts, force, tries=0) {
  if (tries > 9) {
    return P.reject("Couldn't find suitable word pair...");
  }

  return this.getWordPair(srcOpts, relOpts).
  then(words=> {
    // console.log(words);
    if (force || this.isUsableWordPair(words)) {
      return words;
    } else {
      return this.getUsableWordPair(srcOpts, relOpts, force, tries+1);
    }
  });
};

// Word object type
WordHelper.Word = class Word {
  constructor(w) {
    this.text = w;
  }

  toString() {
    return this.text;
  }
};

let wordMethods = ["isUsableWord", "isAdverb", "isntAdverb", "blacklisted"];

wordMethods.forEach(function(fncName) {
  WordHelper.Word.prototype[fncName] = function () {
    return WordHelper.prototype[fncName](this.text);
  }
})

module.exports = exports = WordHelper;
