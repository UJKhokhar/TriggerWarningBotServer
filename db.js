// Import our mongoose library for database interactions
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schema that represents user in DB
const userSchema = new Schema({
  _id: Number,
  username: String,
  bot_access: Boolean,
});

// Schema that represents user in DB
const gameSchema = new Schema({
  name: String,
  notes: String,
  triggers: Array,
});


// Create variables for database connection configs
const DB_USER = process.env.MONGODB_USERNAME;
const DB_PASS = process.env.MONGODB_PASSWORD;
const DB_NAME = process.env.MONGODB_NAME;
const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_NAME}.bu7m1.mongodb.net/TriggerWarningBot?retryWrites=true&w=majority`;
const dbOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// Register schemas
const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);

// Find user from DB
export const userLookUp = async (userId) => {
  try {
    // Connect to DB
    await mongoose.connect(uri, dbOptions);

    // Find user by id
    const user = await User.findById(userId).exec();

    // Disconnect from DB
    await mongoose.disconnect();

    // Return user doc from DB
    return user;

  // Catch and log any errors
  } catch (error) {
    console.log(error);
  }
};

// Find user in the DB and update them to have bot access
export const userUpsertWithBotAccess = async (userData) => {
  try {
    // Connect to DB
    await mongoose.connect(uri, dbOptions);

    // Searching for a specific user
    const filter = {
      _id: userData.id,
    };

    // Indicate what fields we want to update
    const update = {
      bot_access: true,
      username: userData.username,
    };

    const options = {
      // upsert updates existing doc if there is one
      upsert: true,
      // new property returns the updated doc
      new: true,
    };

    // Do the actual database request
    const doc = await User.findOneAndUpdate(filter, update, options);

    // Disconnect from DB
    await mongoose.disconnect();

    return doc;
  } catch (error) {
    console.log(error)
  }
}

// Find user in the DB and remove their bot access
export const removeBotAccess = async (userData) => {
  try {
    // Open DB connection
    await mongoose.connect(uri, dbOptions);

    // Searching for a specific user
    const filter = {
      _id: userData.id,
    };

    // Update user field to remove bot access
    const update = {
      bot_access: false,
    };

    const options = {
      // upsert updates existing doc if there is one
      upsert: true,
      // new property returns the updated doc
      new: true,
    };

    // Do the actual database request
    const doc = await User.findOneAndUpdate(filter, update, options);

    // Disconnect from DB
    await mongoose.disconnect();

    // Return the updated user doc
    return doc;

  // Catch and log any errors
  } catch (error) {
    console.log(error)
  }
};

// Update game's triggers and notes in database
export const gameUpsert = async (gameData) => {
  try {
    // Open DB connection
    await mongoose.connect(uri, dbOptions);

    // Search the DB by game name
    const filter = {
      name: gameData.name,
    };

    // Update these fields in the DB
    const update = {
      notes: gameData.notes,
      triggers: gameData.triggers,
    };

    // Update existing doc and return the new updating doc
    const options = {
      upsert: true,
      new: true,
    };

    // Update the game doc in the DB
    const doc = await Game.findOneAndUpdate(filter, update, options);

    // Disconnect from DB
    await mongoose.disconnect();
    return doc;

  // Catch and log any errors
  } catch (error) {
    console.log(error);
  }
};

// Find and return a game by name
export const gameLookup = async (gameName) => {
  try {
    // Open DB connection
    await mongoose.connect(uri, dbOptions);

    // Set search filter using name
    const filter = {
      name: gameName,
    };

    // Actually search in DB
    const doc = await Game.findOne(filter).exec();

    // Close DB connection
    await mongoose.disconnect();

    // return game doc
    return doc;

  // Catch and log any errors
  } catch (error) {
    console.log(error);
  }
};