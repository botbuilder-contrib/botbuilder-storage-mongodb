const { ActivityTypes, ConversationState, UserState, TurnContext } = require('botbuilder');

class Bot {
    constructor(storage) {
        // Use the mongoStorage instance for ConversationState and UserState
        this.conversationState = new ConversationState(storage);
        this.userState = new UserState(storage);

        //  Conversation State Property
        this.conversationProperty = this.conversationState.createProperty("Convo");

        // User State properties
        this.countProperty = this.userState.createProperty("CountProperty");
        this.nameProperty = this.userState.createProperty("NameProperty");
    }

    /**
     * Process BotFramework's TurnContext
     * @param {TurnContext} context 
    */
    async processBotActivity(context) {
        try {
            if (context.activity.type == ActivityTypes.Message) {

                //Get all storage items
                let conversation = await this.conversationProperty.get(context, { MessageCount: 0, UserReplies: [] });
                let count = await this.countProperty.get(context, 0);
                let name = await this.nameProperty.get(context, context.activity.text);

                // Change the data in some way
                count++;
                conversation.MessageCount = count;
                conversation.UserReplies.push(context.activity.text);

                // Respond back 
                await context.sendActivity(`${count} - Hi ${name}! You said ${context.activity.text}`);

                // Set User State Properties
                await this.nameProperty.set(context, name);
                await this.countProperty.set(context, count);

                // Save UserState changes to MondogD
                await this.userState.saveChanges(context);

                //Set Conversation State property
                await this.conversationProperty.set(context, conversation);

                //Save Conversation State to MongoDb
                await this.conversationState.saveChanges(context);

            }
            // If activity type is DeleteUserData, invoke clean out userState
            else if (context.activity.type === ActivityTypes.DeleteUserData) {
                await this.userState.delete(context);
                await this.userState.saveChanges(context);
            }
        } catch (ex) {
            console.error(ex);
        }
    }
}

module.exports = { Bot };
