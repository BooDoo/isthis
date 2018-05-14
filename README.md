# is this...A GOOD BOT?
## A twitter bot ([@isthisaGOODBOT](https://twitter.com/isthisaGOODBOT))
### generates variations on the "is this a pigeon?" meme.

### Non-NPM Requirements:
   * [Twitter API](https://apps.twitter.com/) credentials
   * [Wordnik API](https://developer.wordnik.com/) credentials — highly recommended*
   * [ImageMagick](http://imagemagick.org) — *should* work with both 6.x and 7.x
  
\* if you don't have a Wordnik API key, words will be randomly selected from [RiTaJS](https://github.com/dhowe/RiTaJS/)
 
### Usage:

Enter your API keys into `credentials.json` then:
```
$ npm i
$ node index.js
{ srcWord: 'tribulation', relWord: 'privation' }
ISTHIS twote:[…]
```
or manually override first/both words:
```
$ node index.js elephant
{ srcWord: 'elephant', relWord: 'dragon' }
ISTHIS twote:[…]

$ node index.js jeers triumph
{ srcWord: 'jeers', relWord: 'triumph' }
ISTHIS twote:[…]
```

## TODO:
   * Sensible commandline arg processing for use as independent script
   * Mess with Wordnik API call defaults to get different/better results
   * Move configuration variables into separate config file
   * Monetize (lol)
   
### THANKS / CREDIT:

[Wordnik](https://www.wordnik.com/) is a great resource and if you want to support them you can ["Adopt" a word](https://www.wordnik.com/adoptaword) at $25 for a year.

The owner of the [*Indizi dell'avvenuta catastrofe*](http://catastrofe.tumblr.com) tumblr posted [this screenshot](http://catastrofe.tumblr.com/post/13801473669/anime-subtitles-are-the-new-zen-yeah-sure) in late 2011.

Sunrise made [*The Brave of Sun Fighbird*](https://en.wikipedia.org/wiki/The_Brave_Fighter_of_Sun_Fighbird) for the 1991 television season.

My buddy Scott asked me if I was making this bot which prompted me to make it.

My friend Drew suggested the username [@isthisagoodbot](https://twitter.com/isthisaGOODBOT).

That I make anything at all is all thanks to the #botALLY community. To the extent what I make is bad, it's no one's fault but my own.
