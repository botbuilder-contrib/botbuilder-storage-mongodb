'use strict'

const { BotFrameworkAdapter } = require('botbuilder');
const { MongoDbStorage } = require('../lib/MongoDbStorage');
const BotGreeting = require('botbuilder-greeting');
const { MongoClient } = require('mongodb');
const { Bot } = require('./bot');

let server = require('restify').createServer();

const adapter = new BotFrameworkAdapter();
adapter.use(new BotGreeting(context => {
  return `Hi I'm your friendly bot. What's your name?`;
}));

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`${server.name} listening to ${server.url}`);
});


(async () => {

  try {
    // Create a MongoClient and connect it.
    const mongoClient = new MongoClient("mongodb://localhost:27017/?connectTimeoutMS=4000", { useUnifiedTopology: true });
    await mongoClient.connect();

    // Grab a collection handle off the connected client
    const collection = MongoDbStorage.getCollection(mongoClient);

    // Create a MongoDbStorage, supplying the collection to it.
    const mongoStorage = new MongoDbStorage(collection);


    /*----------------------------------
    At this point the storage is all set up.
    Everything below here is demo of BotFramework. 
    */

    const bot = new Bot(mongoStorage);


    server.post('/api/messages', async (req, res, next) => {
      adapter.processActivity(req, res, bot.processBotActivity.bind(bot)).catch(e => {
        console.error(e);
        next(e)
      });
    });


  } catch (ex) {
    console.error(ex);
  }
})();
