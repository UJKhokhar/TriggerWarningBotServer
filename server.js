// Packages
import Koa from 'koa';
import cors from '@koa/cors';
import Router from 'koa-router';
import axios from 'axios';
import bodyParser from 'koa-bodyparser';

// DB
import { userLookUp } from './db.js';


const app = new Koa();
const router = new Router();

app
  .use(cors())
  .use(bodyParser());

router
  // Home
  .get('/', (ctx) => {
    ctx.body = 'Hello, world!';
  })
  // Authorize code from front end
  .post('/authorize', async (ctx) => {

    try {
      // Set post data for get token request;
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
      console.log('TOKEN:' + token);

      // Set config for validation endpoint of Twitch API
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }

      // validate token
      const validateTokenRequest = await axios.get('https://id.twitch.tv/oauth2/validate', config);
      const userId = validateTokenRequest.data.user_id;

      // lets add client id to headers
      config.headers['Client-Id'] = process.env.CLIENT_ID;

      // Get user by ID
      const getUserRequest = await axios.get(`https://api.twitch.tv/helix/users?id=${userId}`, config);
      const userData = getUserRequest.data.data[0];
      console.log('user from request: ' + userData);

      //TODO: Do user lookup
      const userFromDb = await userLookUp(userId);
      const username = userData.display_name;
      console.log('userFromDb:   ' + userFromDb);
      console.log('username:   ' + username);

      // If user is not in the DB they are a new user
      // and we need to show add bot to my channel button
      // If they are an existing user we need to see if they have allowed access to the bot
      if (userFromDb) {
        ctx.body = {
          username: username,
          id: userId,
          hasAccessToBot: 'VALUEFROMDB'
        }
      } else {
        ctx.body = {
         username: username,
         id: userId,
         hasAccessToBot: 'No'
        }
      }
      // ctx.status = 200;
    } catch (error) {
      ctx.body = error;
      ctx.status = 400;
      console.log(error);
    }
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3030, () => {
  console.log('Server running on port 3030');
});