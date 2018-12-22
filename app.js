const { BotFrameworkAdapter, ActivityTypes, ConversationState, UserState } = require('botbuilder');
const { MongoDbStorage } = require('./lib/MongoDbStorage');
const BotGreeting = require('botbuilder-greeting');

let server = require('restify').createServer();

const adapter = new BotFrameworkAdapter();
adapter.use(new BotGreeting(context => {
  return `Hi I'm your friendly bot`;
}));

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`${server.name} listening to ${server.url}`);
});

const mongoStorage = new MongoDbStorage({
  url: "mongodb://localhost:27017/",
  database: "botframework"
});
const conversationState = new ConversationState(mongoStorage);
const userState = new UserState(mongoStorage);

let conversationProperty = conversationState.createProperty("Convo");
let countProperty = userState.createProperty("CountProperty");
let nameProperty = userState.createProperty("nameP");

async function save(context, count, name, cState) {

  // await nameProperty.set(context, name);
  // await countProperty.set(context, count);
  // await userState.saveChanges(context);
  await conversationProperty.set(context, cState);
  await conversationState.saveChanges(context);
}
let count = 0;
let name = "";
server.post('/api/messages', async (req, res) => {

  adapter.processActivity(req, res, async context => {

    if (context.activity.type == ActivityTypes.Message) {
      let conversation = await conversationProperty.get(context, {});
      // let count = await countProperty.get(context, 0);
      //  let name = await nameProperty.get(context,"");

      name = "hattan" + count;
      count++;
      conversation = {
        count
      };

      await context.sendActivity(`${count} - You said ${context.activity.text}`);
      await save(context, count, name, conversation);
    }
    else if (context.activity.type === ActivityTypes.DeleteUserData) {
      await userState.delete(context);
      await userState.saveChanges(context);
    }
  });
});
