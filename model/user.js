import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userSchema = new Schema ({
    name: String,
    age: Number,
    status : String,
    avatar: String,
}
)

const User = mongoose.model('user', userSchema);

export {User};


// Comands fore mongoDB Shell
/*
use client
db.createCollection("users")
db.users.insertMany([
  {"name": "Mike", "age": 25, "status": "I'm learning angular", "avatar": "https://i.pravatar.cc/150?img=12"},
  {"name": "Nikola", "age": 32, "status": "Playing piano", "avatar": "https://i.pravatar.cc/150?img=11"}
])
*/