'use strict'

const { BotFrameworkAdapter, ActivityTypes, ConversationState, UserState } = require('botbuilder');
const { MongoDbStorage } = require('../lib/MongoDbStorage');
const BotGreeting = require('botbuilder-greeting');
const { MongoClient } = require('mongodb');

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

    // grab a collection handle off the connected client
    const collection = MongoDbStorage.getCollection(mongoClient);

    // create a MongoDbStorage, supplying the collection to it.
    const mongoStorage = new MongoDbStorage(collection);

    // Use the mongoStorage instance for ConversationState and UserState
    const conversationState = new ConversationState(mongoStorage);
    const userState = new UserState(mongoStorage);

    //  Conversation State Property
    const conversationProperty = conversationState.createProperty("Convo");

    // User State properties
    const countProperty = userState.createProperty("CountProperty");
    const nameProperty = userState.createProperty("NameProperty");


    server.post('/api/messages', async (req, res) => {
      adapter.processActivity(req, res, async context => {
        if (context.activity.type == ActivityTypes.Message) {

          //Get all storage items
          let conversation = await conversationProperty.get(context, { MessageCount: 0, UserReplies: [] });
          let count = await countProperty.get(context, 0);
          let name = await nameProperty.get(context, context.activity.text);

          // Change the data in some way
          count++;
          conversation.MessageCount = count;
          conversation.UserReplies.push(context.activity.text);

          // Respond back 
          await context.sendActivity(`${count} - Hi ${name}! You said ${context.activity.text}`);

          // Set User State Properties
          await nameProperty.set(context, name);
          await countProperty.set(context, count);
          // Save UserState changes to MondogD
          await userState.saveChanges(context);

          //Set Conversation State property
          await conversationProperty.set(context, conversation);
          //Save Conversation State to MongoDb
          await conversationState.saveChanges(context);

        }
        // If activity type is DeleteUserData, invoke clean out userState
        else if (context.activity.type === ActivityTypes.DeleteUserData) {
          await userState.delete(context);
          await userState.saveChanges(context);
        }
      });
    });
  } catch (ex) {
    console.error(ex);
  }
})();
