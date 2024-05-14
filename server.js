// Import libraries and functions

// Koa handles all our routing, cross-origin-response requests and parsing response objects
import Koa from 'koa';
import cors from '@koa/cors';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

// Axios for making external API calls
import axios from 'axios';

// DB
import { userLookUp, userUpsertWithBotAccess, removeBotAccess } from './db.js'

// ONE OFF FUNCTIONS
import './functions.js';

// Bot Functions;
import './bot.js';
import { joinChannel, leaveChannel } from './bot.js';

// Initialize our Koa app
const app = new Koa();
const router = new Router();

// Tell Koa which middlewares to use
app
  .use(cors())
  .use(bodyParser());

// Declare our API routes
router
  // Home
  .get('/', (ctx) => {
    ctx.body = 'Hello, world!';
  })
  // /authorize API endpoint is a POST request
  // This route does the following:
  // 1) Recieve request from front end with authorization request code
  // 2) Use the authorization request code to get a token needed to make requests to the Twitch API
  // 3) Validate the token as described here: https://dev.twitch.tv/docs/authentication/validate-tokens/
  // 4) Make a request to Twitch /users api to get info about our current user
  // 5) With the user info from the API, we do a lookup in our Mongo database to see if user has access to Twitch bot
  // 6) Send response to the front end based on whether the user has bot access or not

  // ctx is used to access the response body

  // TODO: BREAKUP THIS ENDPOINT INTO DIFF FUNCTIONS
  .post('/authorize', async (ctx) => {

    try {
      // Package payload for the Twitch token request
      // and include the request code from the front end
      const data = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: ctx.request.body.code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:8080/#/'
      };

      // Get access token using code we recieved from Front End
      const getTokenRequest = await axios.post('https://id.twitch.tv/oauth2/token', data);
      const token = getTokenRequest.data.access_token;

      // Set config for validation endpoint of Twitch API
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }

      // Twitch requires us to validate our token
      const validateTokenRequest = await axios.get('https://id.twitch.tv/oauth2/validate', config);

      // Grab the users id from the token validation response
      const userId = validateTokenRequest.data.user_id;

      // Lets add client id to headers
      config.headers['Client-Id'] = process.env.CLIENT_ID;

      // Make a Twitch API request to /users to recieve our current users data
      // and store the response as userData
      const getUserRequest = await axios.get(`https://api.twitch.tv/helix/users?id=${userId}`, config);
      const userData = getUserRequest.data.data[0];

      // Access username from our /users Twitch endpoint response
      const username = userData.display_name;

      // Lookup the user in our database
      const userFromDb = await userLookUp(userId);

      // If user is not in the DB they are a new user
      // and we need to edit our API response to change the bot_access property to false
      // If they are an existing user we need to see if they have allowed access to the bot
      // The front end application will show a "Add bot to channel" button for the user
      // if they don't have access to it based on this payload
      if (userFromDb) {
        ctx.body = {
          username: username,
          id: userId,
          bot_access: userFromDb.bot_access,
        }
      } else {
        ctx.body = {
          username: username,
          id: userId,
          bot_access: false,
        }
      }
    // Catch any errors during the entire /authorize request
    } catch (error) {
      ctx.body = error;
      ctx.status = 400;
      console.log(error);
    }
  })

  // POST /requestBotAccess endpoint
  // This endpoint recieves a request from the front end to add the TriggerWarningBot
  // to the current users channel and update their bot access information in our database
  .post('/requestBotAccess', async (ctx) => {
    try {
      // Upsert user into our database with the request's body
      const doc = await userUpsertWithBotAccess(ctx.request.body);

      // Add our TriggerWarningBot to the current user's channel
      joinChannel(doc.username);

      // Send a response to front end with the HTTP code 200 OK
      ctx.body = doc;
      ctx.status = 200;
    }
    // Catch any errors during the entire /requestBotAccess request with an error message
    catch (error) {
      ctx.body = error || 'There was an issue with the add bot access request';
      ctx.status = 400;
    }
  })
  // POST /removeBotAccess endpoint
  // This endpoint recieves a request from the front end to remoe the TriggerWarningBot
  // from the current users channel and updates their bot access information in our database
  .post('/removeBotAccess', async (ctx) => {
    try {
      const doc = await removeBotAccess(ctx.request.body);

      // Remove our TriggerWarningBot from the current user's channel
      leaveChannel(doc.username);

      // Send a response to front end with the HTTP code 200 OK
      ctx.body = doc;
      ctx.status = 200;
    } catch (error) {
      // Catch any errors during the entire /removeBotAccess request with an error message
      ctx.body = error || 'There was an issue with the removing bot access request';
      ctx.status = 400;
    }
  });

// Register our api routes
app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3030, () => {
  console.log('Server running on port 3030');
});