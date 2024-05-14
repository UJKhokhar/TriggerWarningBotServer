// Import libraries and functions

// Import tmi for to Twitch chat (IRC) functionality for our bot
import tmi from 'tmi.js';

// Axios for making external API calls
import axios from 'axios';
import { gameLookup } from './db.js';

// Instantiate our twitch bot client
const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: 'TriggerWarningBot',
    password: process.env.BOT_OAUTH
  },
  // Tell our bot what twitch channels to join
  channels: ['UmiPlaysGames']
});

// Connect our bot to channels
const connectBot = async () => {
  try {
    const connectionResponse = await client.connect();
    // Log connection response
    console.log('Connection response :' + connectionResponse);

  // Catch and log errors
  } catch (error) {
    console.log(error);
  }
};

// Bot auth confi needed for token requests
const data = {
  client_id: process.env.BOT_CLIENT_ID,
  client_secret: process.env.BOT_CLIENT_SECRET,
  grant_type: 'client_credentials'
}


let token;

// Make request for twitch token needed for future Twitch API requests
axios.post('https://id.twitch.tv/oauth2/token', data)
  .then(function (response) {
    // store token response
    token = response.data.access_token;
  })
  .catch(function (error) {
    console.log(error);
  });

await connectBot();

// A function that makes a twitch API call for stream data
const getStreamData = async (config) => {
  try {
    const response = await axios.get('https://api.twitch.tv/helix/streams', config);
    return response;
  } catch (error) {
    console.log(error);
  }
};

// This code block tells the bot what to do when there's a message in chat
client.on('message', async (channel, tags, message, self) => {
  console.log(`channel = ${channel}`);
  console.log(`tags = ${tags}`);
  console.log(`message = ${message}`);
  console.log(`self = ${self}`);
  // Ignore echoed messages aka messages from this bot
  if (self) return;

  // Listen for the specific bot command triggered by '!tw'
  if (message.toLowerCase() === '!tw') {
    // Access channel name from channel property
    const channelName = channel.substring(1);

    // Set config for stream data requests
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': `${data.client_id}`
      },
      params: {
        // user_login: channelName
        // THIS NEEDS TO BE A CURRENTLY LIVE STREAMER OR YOU GET EMPTY DATA
        'user_login': channelName
      }
    };

    // Make actual API request for stream data
    const streamData = await getStreamData(config);

    try {
      // If streamer is not live return message and throw warning
      if (streamData.data.data.length === 0) {
        client.say(channel,
          `Sorry but I only work if you are live`
        );

        throw 'User is not live';
      }

      // Access game name from the previous stream data request
      const gameName = streamData.data.data[0]['game_name'];

      // Lookup the game in our database
      const gameData = await gameLookup(gameName);

      // If we recieved a game from the DB lets output triggers
      if (gameData) {
        const triggersString = gameData.triggers.join(', ');

        // Have our bot say the triggers in the channel
        client.say(channel,
          `Currently playing: ${gameName}.
        Trigger Warnings include: ${triggersString}
        `
        );
      } else {
        // If we recieved null from DB, lets store the game name into DB and output a did not find message
        client.say(channel,
          `Sorry. We don't have any information on ${gameName} at the moment.`
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
});

// Function to make our bot join a channel by channel name
export const joinChannel = async (channelName) => {
  try {
    const response = await client.join(channelName);
    console.log('Join Response:  ' + JSON.stringify(response));
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

// Function to make our bot leave a channel by channel name
export const leaveChannel = async (channelName) => {
  try {
    const response = await client.part(channelName);
    console.log('Leave Response: ' + JSON.stringify(response));
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};