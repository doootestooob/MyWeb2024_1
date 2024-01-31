const express = require('express')

const router = express.Router()

const authcontroller = require('../auth/auth')





router.post('/register', authcontroller.register)

router.post('/login', authcontroller.login)

router.post('/verify', authcontroller.verify)

router.get('/logout', authcontroller.logout)

router.post('/modifyperson', authcontroller.modifyperson)

router.post('/searchfriend' , authcontroller.searchfriend)

router.post('/reqfriendform' , authcontroller.reqfriendform)

router.post('/contact' , authcontroller.contact)

module.exports = router