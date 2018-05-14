#!/usr/bin/env node
'use strict';

const _ = require('lodash');
const P = require('bluebird');
const Twit = require('twit');
const util = require('util');

let TwitHelper = function TwitHelper(config) {
	if (!(this instanceof TwitHelper)) {
		return new TwitHelper(config);
	}

	return TwitHelper.super_.call(this, config);
};

TwitHelper.prototype.postMediaChunkedAsync = P.promisify(Twit.prototype.postMediaChunked);

TwitHelper.prototype.uploadMedia = function uploadMedia(filePath) {
  return this.postMediaChunkedAsync({file_path: filePath});
};

TwitHelper.prototype.assignAltText = function assignAltText(media_id, alt_text) {
  media_id = _.isArray(media_id) ? media_id[0] : media_id;
  return this.post('media/metadata/create', {
        media_id: media_id,
        alt_text: {text: alt_text}
  });
};

TwitHelper.prototype.postTweet = function sendTweet(status, media_ids) {
  media_ids = _.isArray(media_ids) ? media_ids : [media_ids];
  return this.post('statuses/update', {
          status: status,
          media_ids: media_ids
        });
};

// Give me tweet parameters and I'll make you a Promise for a fully-featured tweet.
TwitHelper.prototype.makeTweet = async function tweetWithMediaAndMetadata(status, mediaPath, altText) {
  let uploadResponse, mediaIdStr, metadataResponse, metadataStatus, tweetResponse;

  uploadResponse = mediaPath ? await this.uploadMedia(mediaPath) : null;
  mediaIdStr = uploadResponse ? uploadResponse.media_id_string : null;
  metadataResponse = altText && mediaIdStr ? await this.assignAltText(mediaIdStr, altText) : null;

  return tweetResponse = this.postTweet(status, mediaIdStr);
};

util.inherits(TwitHelper, Twit);

module.exports = exports = TwitHelper;
