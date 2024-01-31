const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    publicKey: {
        type: String,
        unique: true,
        required: true
    },
    privateKey: {
        type: String,
        unique: true,
        required: true
    },
    VertifyGmail: {
        type: Boolean,
        default: false
    },
    VertifyGmailexpireTime: {
        type: Date,
    },
    VertifyCode: {
        type: String,
    },
    VertifyExpireTime: {
        type: Date,
    },
    VertifyCodeBoolean:{
        type:Boolean,
        default:false
    },
    SimpleIntroduce: {
        type: String,
    },
    Sex: {
        type: String,
        default: '尚未選擇'
    },
    PhoneNumber: {
        type: Number,
    },
    Adress: {
        type: String,
    },
    Shop: {
        type: String,
        default: '尚未建立'
    },
    filename: {
        type: String,
    },
    friends: {
        type: Array,
        default: []
    },
    reqfriend: {
        type: Array,
        default: []
    },
})

const User = mongoose.model('User', userSchema)

module.exports = User;