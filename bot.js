import tmi from 'tmi.js';
import axios from 'axios';
import { gameLookup } from './db.js';

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: 'TriggerWarningBot',
    password: 'oauth:oh1tjz1be5n0r0mgitztnbo8p7b6yp'
  },
  channels: ['UmiPlaysGames']
});

const connectBot = async () => {
  try {
    const connectionResponse = await client.connect();
    console.log('connect response :' + connectionResponse);
  } catch (error) {
    console.log(error);
  }
};

const data = {
  client_id: '4jazrsfmne3z0csutqoqk65omxlfjv',
  client_secret: 'i0vmuzqcx9hcai9o26pi44hic3ouya',
  grant_type: 'client_credentials'
}

let token;

axios.post('https://id.twitch.tv/oauth2/token', data)
  .then(function (response) {
    token = response.data.access_token;
  })
  .catch(function (error) {
    console.log(error);
  });

await connectBot();

const getStreamData = async (config) => {
  try {
    const response = await axios.get('https://api.twitch.tv/helix/streams', config);
    return response;
  } catch (error) {
    console.log(error);
  }
};

client.on('message', async (channel, tags, message, self) => {
  console.log(`channel = ${channel}`);
  console.log(`tags = ${tags}`);
  console.log(`message = ${message}`);
  console.log(`self = ${self}`);
  // Ignore echoed messages.
  if (self) return;

  if (message.toLowerCase() === '!tw') {
    const channelName = channel.substring(1);
    console.log('channelName var', channelName);

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': `${data.client_id}`
      },
      params: {
        // user_login: channelName THIS NEEDS TO BE AN ACTIVE STREAMER OR YOU GET EMPTY DATA
        // TODO: NEED TO GET THIS DYNAMICALLY
        'user_login': channelName
      }
    };

    const streamData = await getStreamData(config);

    try {
      if (streamData.data.data.length === 0) {
        client.say(channel,
          `Sorry but I only work if you are live`
        );

        throw 'User is not live';
      }

      const gameName = streamData.data.data[0]['game_name'];
      console.log('gameName + ', gameName);


      // TODO: change name
      const gameStuff = await gameLookup(gameName);

      // If we recieved a game from the DB lets output triggers
      if (gameStuff) {
        const triggersString = gameStuff.triggers.join(', ');

        client.say(channel,
          `Currently playing: ${gameName}.
        Trigger Warnings include: ${triggersString}
        `
        );
      } else {
        // If we null from DB, lets store the game name into DB and output a did not find message
        client.say(channel,
          `Sorry. We don't have any information on ${gameName} at the moment.`
        );

        // TODO: function to add game to 'Needs more info' Collection in the DB
      }
    } catch (error) {
      console.log(error);
    }
  }
});

export const joinChannel = async (channelName) => {
  console.log('joining channel');
  try {
    const response = await client.join(channelName);
    console.log('Join Response:  ' + JSON.stringify(response));
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const leaveChannel = async (channelName) => {
  console.log('leaving channel');
  try {
    const response = await client.part(channelName);
    console.log('Leave Response: ' + JSON.stringify(response));
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

// curl - X GET 'https://api.twitch.tv/helix/streams' \
// -H 'Authorization: Bearer 2gbdx6oar67tqtcmt49t3wpcgycthx' \
// -H 'Client-Id: wbmytr93xzw8zbg0p1izqyzzc5mbiz'

// curl - X GET 'https://api.twitch.tv/helix/users?id=141981764' \
// -H 'Authorization: Bearer cfabdegwdoklmawdzdo98xt2fo512y' \
// -H 'Client-Id: uo6dggojyb8d6soh92zknwmi5ej1q2'


// ?client_id = 4jazrsfmne3z0csutqoqk65omxlfjv & client_secret=i0vmuzqcx9hcai9o26pi44hic3ouya & grant_type=client_credentials

