const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../modules/users')
const { OneToOneChatroom } = require('../modules/chatroom')
const router = express.Router()
const Contact = require('../modules/contact')
const authcontroller = require('../auth/auth')

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/register', (req, res) => {
    res.render('register')
})

router.get('/about', (req, res) => {
    res.render('about')
})

router.get('/vertify', authcontroller.vertifyMail)

router.get('/otpverify', async (req, res) => {
    try {

        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    res.render('otpverify', {
                        user: decodedToken,
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }
})

router.get('/loginsuccess', async (req, res) => {
    try {


        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const updatedUser = await User.findById(decodedToken.id);

                    res.render('loginsuccess', {
                        user: updatedUser
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }
})

//修改個人資料頁面
router.get('/personal', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('personal', {
                        user: updatedUser
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }

})

//好友列表頁面
router.get('/chat', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const users = await User.findOne({ email: decodedToken.email });

                    const friends = users.friends || [];

                    const uniqueEmails = new Set(); //用來過濾重複的email

                    const divElements = await Promise.all(user.friends.map(async (friend, index) => {
                        if (!uniqueEmails.has(friend)) {
                            uniqueEmails.add(friend);

                            const person = await User.findOne({ email: friend });

                            if (person) {
                                if (person.filename == '' || person.filename === undefined) {
                                    return `<div class="friend" id="${person.email}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                    class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                    <path
                                    d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                    <path
                                    d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                    </svg>
                                    <nobr>${person.name}</nobr>&emsp;&emsp;
                                    <div class="friendbutton">
                                    <button class="chat" onclick="chatfunction('${person.email}')"><nobr style="color:black;">聊天</nobr></button>
                                    <button class="delete" onclick="deletefunction('${person.email}')"><nobr style="color:white;">刪除</nobr></button>
                                    </div>
                                </div>`;
                                } else {
                                    return `<div class="friend" id="${person.email}">
                                    <img src="/uploads/${person.filename}" width="100px" style="border-radius:50%;"><nobr
                                    style="color:black;">${person.name}</nobr>&emsp;&emsp;
                                    <div class="friendbutton">
                                    <button class="chat" onclick="chatfunction('${person.email}')"><nobr style="color:black;">聊天</nobr></button>
                                    <button class="delete" onclick="deletefunction('${person.email}')"><nobr style="color:white;">刪除</nobr></button>
                                    </div>
                                </div>`;
                                }
                            }
                        } else {
                            return '';
                        }
                    }));

                    const friendsresults = divElements.join('');
                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('chat', {
                        user: updatedUser, friendsresults
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }
})

// 添加好友頁面
router.get('/addfriendpage', async (req, res) => {

    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;

                    const friendresults = req.session.searchfriend || [];



                    res.render('addfriendpage', {
                        user: updatedUser, friendresults
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }
})

// 申請好友列表頁面
router.get('/applylist', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);

            if (!user) {
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;

                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean;
                    if (verifycodeboolean === false) {
                        return res.redirect('/');
                    }

                    const users = await User.findOne({ email: decodedToken.email });
                    const results = users.reqfriend || [];

                    const uniqueEmails = new Set();
                    const divElements = await Promise.all(results.map(async (result, index) => {
                        if (!uniqueEmails.has(result)) {
                            uniqueEmails.add(result);

                            const person = await User.findOne({ email: result });

                            if (person) {
                                if (person.filename == '' || person.filename === undefined) {
                                    return `<div class="applylist" id="${person.email}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                    class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                    <path
                                    d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                    <path
                                    d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                    </svg>
                                    <nobr>${person.name}</nobr>&emsp;&emsp;
                                    <div class="applylistbutton">
                                    <button class="accept" onclick="acceptfunction('${person.email}')"><nobr style="color:white;">接受</nobr></button>
                                    <button class="refuse" onclick="refusefunction('${person.email}')"><nobr style="color:white;">拒絕</nobr></button>
                                    </div>
                                </div>`;
                                } else {
                                    return `<div class="applylist" id="${person.email}">
                                    <img src="/uploads/${person.filename}" width="100px" style="border-radius:50%;">
                                    <nobr>${person.name}</nobr>&emsp;&emsp;
                                    <div class="applylistbutton">
                                    <button class="accept" onclick="acceptfunction('${person.email}')"><nobr style="color:white;">接受</nobr></button>
                                    <button class="refuse" onclick="refusefunction('${person.email}')"><nobr style="color:white;">拒絕</nobr></button>
                                    </div>
                                </div>`;
                                }
                            }
                        }
                        return '';
                    }));

                    const length = user.reqfriend.length || 0;
                    const allresults = divElements.join('');

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('applylist', {
                        user: updatedUser,
                        length,
                        allresults
                    });
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }
});

// 聊天室選擇頁面
router.get('/chatroomchoose', async (req, res) => {
    const AuthToken = req.cookies.jwt; //網路簽章

    if (!AuthToken) {

        return res.redirect('/');

    } else {
        const userId = jwt.decode(AuthToken).id;
        const user = await User.findById(userId);
        if (!user) {

            return res.redirect('/');
        } else {
            const publicKey = user.publicKey;
            jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                if (err) {
                    return res.redirect('/');
                }

                const verifycodeboolean = user.VertifyCodeBoolean
                if (verifycodeboolean === false) {
                    return res.redirect('/')
                }



                const updatedUser = await User.findById(decodedToken.id) || decodedToken;

                const chathistorylist = await OneToOneChatroom.find({ roomname: { $regex: decodedToken.email } }) || [];

                const divElements = await Promise.all(chathistorylist.map(async (chathistory, index) => {

                    const friendemail = chathistory.roomname.replace(decodedToken.email, '').replace('&', '');

                    const friend = await User.findOne({ email: friendemail });

                    const length = chathistory.messages.length || 0;

                    if (friend && chathistory.messages.length > 0) {
                        if (friend.filename == '' || friend.filename === undefined) {
                            return `<div class="roomlist" id="${friend.email}" onclick="chatfunction('${friend.email}')" >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                    class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                    <path
                                    d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                    <path
                                    d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                    </svg>
                                    <div class="roomdetail">
                                            <div class="roomlistcontentname">
                                                <nobr>${friend.name}</nobr>
                                            </div>
                                            <div class="roomlistcontentmessage">
                                                <nobr>${chathistory.messages[length - 1].content}</nobr>
                                            </div>
                                        </div>
                                        <div class="newmegtime">
                                            <nobr>${chathistory.messages[length - 1].timestamp}</nobr>
                                        </div>                         
                                </div>`;
                        } else {
                            return `<div class="roomlist" id="${friend.email}" onclick="chatfunction('${friend.email}')">
                                        <div class="roomlistcontentimg">
                                            <img src="/uploads/${friend.filename}">
                                        </div>
                                        <div class="roomdetail">
                                            <div class="roomlistcontentname">
                                                <nobr>${friend.name}</nobr>
                                            </div>
                                            <div class="roomlistcontentmessage">
                                                <nobr>${chathistory.messages[length - 1].content}</nobr>
                                            </div>
                                        </div>
                                        <div class="newmegtime">
                                            <nobr>${chathistory.messages[length - 1].timestamp}</nobr>
                                        </div>
                                       
                                    </div>`;
                        }
                    } else {
                        return '';
                    }
                }));

                const chatroomresults = divElements.join('');

                res.render('chatroomchoose', {
                    user: updatedUser, chatroomresults
                });
            })
        }
    }
})

// 聊天室頁面
router.get('/chatroom', async (req, res) => {
    const AuthToken = req.cookies.jwt; //網路簽章
    const friendemail = req.query.friendmail;
    console.log(friendemail);
    if (!AuthToken) {

        return res.redirect('/');

    } else {
        const userId = jwt.decode(AuthToken).id;
        const user = await User.findById(userId);

        if (!user) {

            return res.redirect('/');
        } else {
            const publicKey = user.publicKey;
            jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                if (err) {
                    return res.redirect('/');
                }
                const havethefriend = user.friends.includes(friendemail);

                if (havethefriend === false) {
                    return res.redirect('/chat');
                }
                const verifycodeboolean = user.VertifyCodeBoolean
                if (verifycodeboolean === false) {
                    return res.redirect('/')
                }

                const friend = await User.findOne({ email: friendemail });

                const friendname = friend.name;

                const chatroomalreadyexist = await OneToOneChatroom.findOne({ $or: [{ roomname: friend.email + "&" + user.email }, { roomname: user.email + "&" + friend.email }] }) || [];;

                if (chatroomalreadyexist.length < 1) {
                    console.log('聊天室不存在');
                    const newchatroom = new OneToOneChatroom({
                        roomname: friend.email + "&" + user.email,
                        friendPublicKeys: [user.publicKey, friend.publicKey],
                    })
                    await newchatroom.save();

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;

                    const chatroom = await OneToOneChatroom.findOne({ $or: [{ roomname: friend.email + "&" + user.email }, { roomname: user.email + "&" + friend.email }] }) || [];;

                    const chathistorydivElements = await Promise.all(chatroom.messages.map((message) => {
                        if (message.sender == user.email) {
                            return ` <div class="mymsg">
                                            <div class="mymsgtime">
                                                ${message.timestamp}
                                            </div>
                                            <div class="mymsgtext">
                                                 ${message.content}
                                            </div>
                                        </div> `;
                        } else {
                            if (friend.filename == '' || friend.filename === undefined) {
                                return `<div class="yourmsg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="gray"
                                                class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                                <path
                                                d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                                <path
                                                d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                                </svg>
                                                <div class="friendname">
                                                    <nobr>${friend.name}</nobr>
                                                </div>
                                                <div class="yourmsgtext">
                                                    ${message.content}
                                                </div>
                                                <div class="yourmsgtime">
                                                    ${message.timestamp}
                                                </div>
                                            </div>`;

                            }
                            return `<div class="yourmsg">
                                            <img src="/uploads/${friend.filename}">
                                            <div class="friendname">
                                                <nobr>${friend.name}</nobr>
                                            </div>
                                            <div class="yourmsgtext">
                                                ${message.content}
                                            </div>
                                            <div class="yourmsgtime">
                                                ${message.timestamp}
                                            </div>
                                        </div>`;
                        }

                    }))
                    const friendemail = friend.email;
                    const chathistoryresults = chathistorydivElements.join('');
                    res.render('chatroom', {
                        user: updatedUser, friendname, chathistoryresults, friendemail
                    });
                } else {
                    console.log('聊天室已存在無須再建立');

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;

                    const havethefriend = user.friends.includes(friendemail);

                    if (havethefriend === false) {
                        return res.redirect('/');
                    } else {
                        const friend = await User.findOne({ email: friendemail });

                        const friendname = friend.name;

                        const chatroom = await OneToOneChatroom.findOne({ $or: [{ roomname: friend.email + "&" + user.email }, { roomname: user.email + "&" + friend.email }] }) || [];;

                        const chathistorydivElements = await Promise.all(chatroom.messages.map(async (message) => {

                            if (message.sender == user.email) {
                                return ` <div class="mymsg">
                                            <div class="mymsgtime">
                                                ${message.timestamp}
                                            </div>
                                            <div class="mymsgtext">
                                                 ${message.content}
                                            </div>
                                        </div> `;
                            } else {
                                if (friend.filename == '' || friend.filename === undefined) {
                                    return `<div class="yourmsg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="gray"
                                                class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                                <path
                                                d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                                <path
                                                d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                                </svg>
                                                <div class="friendname">
                                                    <nobr>${friend.name}</nobr>
                                                </div>
                                                <div class="yourmsgtext">
                                                    ${message.content}
                                                </div>
                                                <div class="yourmsgtime">
                                                    ${message.timestamp}
                                                </div>
                                            </div>`;

                                }
                                return `<div class="yourmsg">
                                            <img src="/uploads/${friend.filename}">
                                            <div class="friendname">
                                                <nobr>${friend.name}</nobr>
                                            </div>
                                            <div class="yourmsgtext">
                                                ${message.content}
                                            </div>
                                            <div class="yourmsgtime">
                                                ${message.timestamp}
                                            </div>
                                        </div>`;
                            }

                        }))

                        const chathistoryresults = chathistorydivElements.join('');

                        res.render('chatroom', {
                            user: updatedUser, friendname, chathistoryresults, friendemail
                        });
                    }

                }


            })

        }
    }
})

//日記頁面
router.get('/diary', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('diary', {
                        user: updatedUser
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('index', { message: '伺服器錯誤' });
    }

})

//歷程頁面
router.get('/updatehistory', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('updatehistory', {
                        user: updatedUser
                    });
                })
            }
        }

    } catch (error) {
        console.log(error);
    }
})

//聯絡頁面
router.get('/contact', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }

                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }

                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('contact', {
                        user: updatedUser
                    });
                })
            }
        }

    } catch (error) {
        console.log(error);
    }

});

//回復清單頁面
router.get('/reply', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章
        if (!AuthToken) {
            return res.redirect('/');
        } else {
            const userId = jwt.decode(AuthToken).id;
            const user = await User.findById(userId);
            if (!user) {
                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;
                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }
                    const verifycodeboolean = user.VertifyCodeBoolean;
                    if (verifycodeboolean === false) {
                        return res.redirect('/');
                    }
                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    const contactinfo = await Contact.find({ email: decodedToken.email });

                    const divElements = await Promise.all(contactinfo.map(async (contact, index) => {

                        let statecolor = "red";
                        if (contact.replystatus == "Yes") {
                            statecolor = "green";
                        } else {
                            statecolor = "red";
                        }

                        return `<tr> 
                        <td style="overflow: scroll;">${contact.title}</td>
                        <td>${contact.classify}</td>
                        <td style="color:yellow">${contact.degree}</td>
                        <td style="overflow: scroll;">${contact.reply}</td>
                        <td style="color:${statecolor}">${contact.replystatus}</td>
                        </tr>`;
                    }))
                    const contactresults = divElements.join('');

                    res.render('reply', {
                        user: updatedUser, contactresults
                    });
                })
            }
        }
    } catch (error) {
        console.log(error);
    }
})

//商店頁面
router.get('/shop', async (req, res) => {
    try {
        const AuthToken = req.cookies.jwt; //網路簽章

        if (!AuthToken) {

            return res.redirect('/');

        } else {
            const userId = jwt.decode(AuthToken).id;

            const user = await User.findById(userId);
            if (!user) {

                return res.redirect('/');
            } else {
                const publicKey = user.publicKey;

                jwt.verify(AuthToken, publicKey, { algorithms: 'RS256' }, async (err, decodedToken) => {
                    if (err) {
                        return res.redirect('/');
                    }
                    const verifycodeboolean = user.VertifyCodeBoolean
                    if (verifycodeboolean === false) {
                        return res.redirect('/')
                    }
                    const updatedUser = await User.findById(decodedToken.id) || decodedToken;
                    res.render('shop', {
                        user: updatedUser
                    });
                })
            }
        }

    } catch (error) {
        console.log(error);
    }
})

module.exports = router