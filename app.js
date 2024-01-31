const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const socketio = require('socket.io');

const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate  };

const server = https.createServer(credentials, app);

const io = socketio(server);

const dotenv = require('dotenv')
const ip = '192.168.0.23'
const port = 5555
const moment = require('moment')
const User = require('./modules/users')
const { OneToOneChatroom } = require('./modules/chatroom');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const session = require('express-session');

//使用session保存搜尋的歷程
app.use(session({
    secret: '123456',
    resave: false,
    saveUninitialized: true,
}))

dotenv.config({ path: './config.env' })

const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URL)

const db = mongoose.connection;

db.on('error', () => {
    console.log('數據庫連接失敗...');
})

db.once('open', () => {
    console.log('數據庫連接成功！！');
})

//隨時刪除未驗證信箱
function deleteuser() {
    setInterval(async () => {

        const user = await User.find({ VertifyGmail: false })
        user.forEach(async (user) => {
            if (Date.now() > user.VertifyGmailexpireTime) {
                await User.deleteOne({ _id: user._id })
            }
        })
    }, 1000)
}
deleteuser()

app.set('view engine', 'hbs')

//未登入者無法訪問登入後開放的資源
async function VerifyAccount(req, res, next) {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章
        if (!AuthToken) {
            console.log('有訪問者未登入想要訪問未開放資源');
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {
                console.log('有訪問者未登入想要訪問未開放資源');
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, (err, decodedToken) => {
                    if (err) {
                        console.log('有訪問者偽造token想要訪問未開放資源');
                        return res.redirect('/');
                    }
                    next();
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }
}

/*==========================即時監聽與動作=============================== */
io.on('connection', (socket) => {
    console.log('有人連接了...');

    const cookies = socket.request.headers.cookie;
    const cookie = cookies.split('=')[1];

    let AuthToken = cookie.split(';')[0];

    //AuthToken因為未做要求動作而變短
    if (AuthToken.length < 200) {
        const newcookie = cookies.split('=')[2];
        AuthToken = newcookie
    }

    //即時更新好友請求列表
    socket.on('forwardreqfrirnd', async (data) => {


        console.log('即時發送好友請求中');
        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            return res.redirect('/');
        } else if (!AuthToken) {
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;
            const user = await User.findById(userId);

            if (!user) {
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }
                    const me = await User.findOne({ email: decodedToken.email })

                    io.emit('forwardreqfrirnd', { myemail: me });
                })
            }
        }
    })

    //即時接受好友請求
    socket.on('accept', async (data) => {
        console.log(`接受此信箱好友請求: ${data.email}`);

        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            return res.redirect('/');
        } else if (!AuthToken) {
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;
            const user = await User.findById(userId);

            if (!user) {
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const friend = await User.findOne({ email: data.email })
                    const me = await User.findOne({ email: decodedToken.email })

                    await User.updateOne({ email: friend.email }, { $addToSet: { friends: decodedToken.email } }, { new: true })
                    await User.updateOne({ email: decodedToken.email }, { $addToSet: { friends: data.email }, $pull: { reqfriend: data.email } }, { new: true })
                    socket.emit('accept', { email: data.email, myreqfriend: me });
                })
            }
        }

    })

    //即時拒絕好友請求
    socket.on('refuse', async (data) => {
        console.log(`拒絕此信箱好友請求: ${data.email}`);

        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            return res.redirect('/');
        } else if (!AuthToken) {
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;

            const user = await User.findById(userId);

            if (!user) {
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const me = await User.findOne({ email: decodedToken.email })
                    await User.updateOne({ email: decodedToken.email }, { $pull: { reqfriend: data.email } }, { new: true })
                    socket.emit('refuse', { email: data.email, myreqfriend: me });
                })
            }
        }

    })

    //即時刪除好友
    socket.on('deletefriend', async (data) => {
        console.log(`刪除此信箱好友: ${data.email}`);

        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            return res.redirect('/');
        } else if (!AuthToken) {
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;

            const user = await User.findById(userId);

            if (!user) {
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const me = await User.findOne({ email: decodedToken.email })
                    await OneToOneChatroom.deleteOne({ $or: [{ roomname: data.email + "&" + me.email }, { roomname: me.email + "&" + data.email }] })
                    await User.updateOne({ email: decodedToken.email }, { $pull: { friends: data.email } }, { new: true })
                    await User.updateOne({ email: data.email }, { $pull: { friends: decodedToken.email } }, { new: true })
                    socket.emit('deletefriend', { email: data.email, myreqfriend: me });
                })
            }
        }


    })

    //即時更新好友新增列表
    socket.on('updatefriend', async (data) => {
        console.log(`更新好友列表`);

        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            console.log('更新好友列表時發生錯誤：cookies == undefined || cookie == undefined || AuthToken == undefined');
            return res.redirect('/');
        } else if (!AuthToken) {
            console.log('更新好友列表時發生錯誤：!AuthToken');
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;

            const user = await User.findById(userId);

            if (!user) {
                console.log('更新好友列表時發生錯誤：!user');
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        console.log('更新好友列表時發生錯誤：err');
                        return res.redirect('/');
                    }
                    console.log('更新好友列表成功');
                    const me = await User.findOne({ email: decodedToken.email })
                    io.emit('updatefriendforward', { myreqfriend: me });
                })
            }
        }
    })

    //即時更新好友刪除列表
    socket.on('updatefrienddelete', async (data) => {
        console.log(`更新好友刪除列表`);

        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            console.log('更新好友刪除列表時發生錯誤：cookies == undefined || cookie == undefined || AuthToken == undefined');
            return res.redirect('/');
        } else if (!AuthToken) {
            console.log('更新好友刪除列表時發生錯誤：!AuthToken');
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;

            const user = await User.findById(userId);

            if (!user) {
                console.log('更新好友刪除列表時發生錯誤：!user');
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        console.log('更新好友刪除列表時發生錯誤：err');
                        return res.redirect('/');
                    }
                    console.log('更新好友刪除列表成功');
                    const me = await User.findOne({ email: decodedToken.email })
                    io.emit('updatefrienddeleteforward', { myreqfriend: me.email });
                })
            }
        }
    })

    //即時發送訊息
    socket.on('sendmsg', async (data) => {
        console.log(`發送訊息給: ${data.email}`);

        if (cookies == undefined || cookie == undefined || AuthToken == undefined) {
            console.log('發送訊息時發生錯誤：cookies == undefined || cookie == undefined || AuthToken == undefined');
            return res.redirect('/');
        } else if (!AuthToken) {
            console.log('發送訊息時發生錯誤：!AuthToken');
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id || jwt.decode(AuthToken)._id;

            const user = await User.findById(userId);

            if (!user) {
                console.log('發送訊息時發生錯誤：!user');
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        console.log('發送訊息時發生錯誤：err');
                        return res.redirect('/');
                    }

                    if (data.mymsg == '') {
                        console.log('未輸入訊息');
                        return;
                    }
                    console.log(user.name + '發送訊息：' + data.mymsg);

                    const me = await User.findOne({ email: decodedToken.email })

                    const chatroom = await OneToOneChatroom.findOne({ $or: [{ roomname: data.email + "&" + me.email }, { roomname: me.email + "&" + data.email }] }) || [];

                    const havethefriend = me.friends.includes(data.email)

                    if (havethefriend === false) {
                        console.log('未加入好友');
                        return;
                    }
                    const friend = await User.findOne({ email: data.email })
                    await OneToOneChatroom.updateOne({ $or: [{ roomname: data.email + "&" + me.email }, { roomname: me.email + "&" + data.email }] }, { $push: { messages: { sender: me.email, receiver: data.email, content: data.mymsg, timestamp: Date.now(), senderread: true, receiverread: false } } }, { new: true })
                    function standardtime(time) {
                        return moment(time).format("YYYY/M/D HH:mm");
                    }


                    io.emit('updatesendmsg', { myname: me.name, senderemail: me.email, mytokenemail: decodedToken.email, myimg: me.filename, mymsg: data.mymsg, msgfortime: standardtime(Date.now()), friendname: friend.name, receiveremail: data.email, friendimg: friend.filename });

                    const newchatlist = await OneToOneChatroom.findOne({ $or: [{ roomname: data.email + "&" + me.email }, { roomname: me.email + "&" + data.email }] }) || [];
                    const length = newchatlist.messages.length || 0;
                    const timestamp = newchatlist.messages[length - 1].timestamp || 0;
                    const newtime = standardtime(timestamp)
                    io.emit('updatesendmsglistforward', { newtime, length, chathistorylist: newchatlist, myname: me.name, friendname: friend.name, friendimg: friend.filename, myemail: me.email, friendemail: friend.email ,myimg: me.filename});
                })
            }
        }
    })

    socket.on('disconnect', () => {
        console.log('有人斷開了連接...');
    });
})

/* =========================================================================== */

app.use('/', express.static('public'))

app.use('/uploads', VerifyAccount, express.static('uploads'));

app.use(express.urlencoded({ extended: false }))

app.use('/auth', express.static('public'))

app.use('/', require('./routes/pages'))

app.use('/auth', require('./routes/auth'))

server.listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`);
});
//mkcert -key-file C:\key.pem -cert-file C:\cert.pem "alantsai1024.local" 122.99.50.26 192.168.0.23
//mkcert -key-file C:\key.pem -cert-file C:\cert.pem "*.alantsai1024.local" 122.99.50.26 192.168.0.23
