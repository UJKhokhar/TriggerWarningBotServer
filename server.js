import Koa from 'koa';
import cors from '@koa/cors';
import Router from 'koa-router';
import axios from 'axios';
import bodyParser from 'koa-bodyparser';

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
    // ctx.body = ctx.request.body;
    // console.log(JSON.stringify(ctx.params));
    console.log(ctx.request.body);
    // console.log(JSON.stringify(ctx.body));
    // ctx.body = `CODE: ${ctx.query.code}`;

    const data = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: ctx.request.body.code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:8080/#/'
    };

    // Get access token using code we recieved from Front End
    let token;
    await axios.post('https://id.twitch.tv/oauth2/token', data)
      .then((response) => {
        token = response.data.access_token;
        console.log(`token: ${token}`);
      })
      .catch((error) => {
        console.log(error);
      });

    // Set config for validation endpoint of Twitch API
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }

    // validate token
    let userId;
    await axios.get('https://id.twitch.tv/oauth2/validate', config)
      .then((response) => {
        // save user ID from response
        userId = response.data.user_id;
      })
      .catch((error) => {
        console.log('validation error');
        console.log(error);
      });

    // lets add client id to headers
    config.headers['Client-Id'] = process.env.CLIENT_ID;

    // Get user by ID
    await axios.get(`https://api.twitch.tv/helix/users?id=${userId}`, config)
      .then((response) => {
        ctx.body = response.data;
        ctx.status = 200;
      })
      .catch((error) => {
        console.log(`User ID Call: ${error}`);
      });

    // return next();
  })
;

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3030, () => {
  console.log('Server running on port 3030');
});

// console.log(process.env.MONGODB_USERNAME);

// import { MongoClient } from 'mongodb';

// const user = process.env.MONGODB_USERNAME;
// const pass = process.env.MONGODB_PASSWORD;
// const db = process.env.MONGODB_NAME;

// const uri = `mongodb+srv://${user}:${pass}@${db}.bu7m1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   const collection = client.db('test_games').collection('listingsAndReviews');
//   // perform actions on the collection object

//   console.log(collection);
//   client.close();
// });

// ghosts, screaming, creepy voices, blinking flashlights, death, eerie environment, bones, creepy writing