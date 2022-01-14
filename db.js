//DB
import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  user_id: Number,
  bot_access: Boolean,
});

const DB_USER = process.env.MONGODB_USERNAME;
const DB_PASS = process.env.MONGODB_PASSWORD;
const DB_NAME = process.env.MONGODB_NAME;

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_NAME}.bu7m1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const options = { useNewUrlParser: true, useUnifiedTopology: true };

const User = mongoose.model('User', userSchema);

const connectDb = async () => {
  try {
    await mongoose.connect(uri, options);
    const id = '5ebadc45a99bde77b2efb20e';
    const user = await User.findById(id);

    if (user == null) {
      console.log('user not found');
    } else {
      
    }

    mongoose.disconnect();
  } catch (error) {
    console.log(error)
  }
}

connectDb();
