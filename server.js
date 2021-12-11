import Koa from 'koa';
const app = new Koa();

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

app.listen(3000);

console.log(process.env.MONGODB_USERNAME);

import { MongoClient } from 'mongodb';

const user = process.env.MONGODB_USERNAME;
const pass = process.env.MONGODB_PASSWORD;
const db = process.env.MONGODB_NAME;

const uri = `mongodb+srv://${user}:${pass}@${db}.bu7m1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db('test_games').collection('listingsAndReviews');
  // perform actions on the collection object

  console.log(collection);
  client.close();
});

// ghosts, screaming, creepy voices, blinking flashlights, death, eerie environment, bones, creepy writing