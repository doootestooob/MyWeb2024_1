const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./users');
const moment = require('moment');

const chatMessageSchema = new Schema({
    sender:{
        type: String,
        required: true,
    },
    receiver:{
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        get: function(timestamp) {
            return moment(timestamp).format("YYYY/M/D HH:mm");
        },
    },
    senderread: {
        type: Boolean,
        default: false,
    },
    receiverread: {
        type: Boolean,
        default: false,
    },
});

const oneToOneChatroomSchema = new Schema({
    roomname: {
        type: String,
        required: true,
        unique: true,
    },
    friendPublicKeys: [{
        type: Array,
        required: true,
        default: [],
    }],
    messages: [chatMessageSchema],
});

const OneToOneChatroom = mongoose.model('OneToOneChatroom', oneToOneChatroomSchema);

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = { OneToOneChatroom, ChatMessage };
