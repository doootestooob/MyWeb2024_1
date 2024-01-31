const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    classify: {
        type: String,
        required: true
    },
    degree: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    reply: {
        type: String,
        default: '尚未回覆'
    },
    replystatus: {
        type: String,
        default: 'No'
    },

})

const Contact = mongoose.model('Contact', contactSchema)

module.exports = Contact