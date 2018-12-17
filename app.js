const {BotFrameworkAdapter,ActivityTypes,ConversationState, UserState} = require('botbuilder');
const {MongoDbStorage} = require('./lib/MongoDbStorage');
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
  url : "mongodb://localhost:27017/",
  database: "botframework"
});

const conversationState = new ConversationState(mongoStorage);
const userState = new UserState(mongoStorage);

let countProperty = userState.createProperty("CountProperty");

async function save(context,count){
  await countProperty.set(context,count);
  await userState.saveChanges(context);
}
server.post('/api/messages', async (req, res) => {
  
  adapter.processActivity(req,res, async context=>{

    if(context.activity.type == ActivityTypes.Message){
      let count = await countProperty.get(context,0);
      count++;

      await context.sendActivity(`${count} - You said ${context.activity.text}`);
      await save(context,count);
    }
  });
});