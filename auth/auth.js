const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../modules/users')
const Contact = require('../modules/contact')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')

const multiparty = require('multiparty')
const fs = require('fs')
const path = require('path')

dotenv.config({ path: './config.env' })


//創建公鑰與私鑰
function generatepairkey() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        }
    })
}




//註冊
exports.register = async (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const passwordconfirm = req.body.passwordconfirm


    if (!name | !email | !password | !passwordconfirm) {
        res.render('register', { message: '請輸入完整資訊！' })
    } else if (password != passwordconfirm) {
        res.render('register', { message: '密碼不一致！' })
    }

    const hasuser = await User.findOne({ email })

    if (hasuser) {
        res.render('register', { message: '此信箱已被註冊！' })
    } else {
        const { publicKey, privateKey } = generatepairkey()
        const hashedpassword = await bcrypt.hash(password, 8)

        const newuser = new User({
            name,
            email,
            password: hashedpassword,
            publicKey,
            privateKey,
            VertifyGmailexpireTime: Date.now() + 5 * 60 * 1000
        })

        await newuser.save()

        const sendVertifyMail = async (name, email, userid) => {
            try {
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    auth: {
                        user: process.env.EMAIL_ADMIN,
                        pass: process.env.EMAIL_PASS
                    },
                })

                const mailOptions = {
                    from: process.env.EMAIL_ADMIN,
                    to: email,
                    subject: '註冊驗證信',
                    html: '<h2>尊敬的' + name + '您好，恭喜您已成功註冊，請點擊此<a href="https://localhost:5555/vertify?id=' + userid + '">連結</a>完成驗證來啟用帳號，若不是您本人請不要點擊此連結，此外若未完成啟用帳號，服務器將在5分鐘後註銷該帳號。</h2>'
                }

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    }
                    console.log('信件：' + info);
                })

            } catch (error) {
                console.log(error);
            }
        }

        if (newuser) {
            sendVertifyMail(req.body.name, req.body.email, newuser._id)
            res.render('login', { message: '註冊成功！請去信箱完成驗證' })
        }
    }



}

//信箱驗證
exports.vertifyMail = async (req, res) => {
    try {
        const user = await User.findById(req.query.id) || 0
        if (Date.now() > user.VertifyGmailexpireTime & user.VertifyGmail === false | user === 0) {
            await User.deleteOne({ _id: req.query.id })
            res.render('errorverify')
        } else {
            const updateinfor = await User.updateOne({ _id: req.query.id }, { $set: { VertifyGmail: true } })
            res.render('emailvertify')
        }
    } catch (error) {
        console.log(error);
    }
}


//登入
exports.login = async (req, res) => {
    const { email, password } = req.body

    try {
        if (!email | !password) {
            res.render('login', { message: '資料未填寫齊全！' })
        } else if (!(await User.findOne({ email }))) {
            res.render('login', { message: '此信箱尚未註冊！' })
        } else {
            const user = await User.findOne({ email })
            const DBpassword = user.password
            const GmailBoolean = user.VertifyGmail

            const matchpassword = await bcrypt.compare(password, DBpassword)


            if (!matchpassword) {
                res.render('login', { message: '密碼錯誤！' })
            } else {
                if (GmailBoolean === false) {
                    res.render('login', { message: '請先驗證信箱！' })
                } else {
                    const verifycode = await crypto.randomBytes(256).toString('base64').substring(0, 5)
                    const payload = {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        publicKey: user.publicKey
                    }
                    const privatekey = user.privateKey

                    await User.updateOne({ _id: user._id }, { $set: { VertifyCode: verifycode, VertifyExpireTime: Date.now() + 5 * 60 * 1000, VertifyCodeBoolean: false } })

                    const token = jwt.sign(payload, privatekey, { algorithm: 'RS256' })

                    res.cookie('jwt', token, { httpOnly: true, expires: new Date(Date.now() + 120 * 60 * 1000) })

                    console.log(user.name, '要求登入動作');

                    const sendVertifyMail = async (name, email, userid, verifycode) => {
                        try {
                            const transporter = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 587,
                                secure: false,
                                requireTLS: true,
                                auth: {
                                    user: process.env.EMAIL_ADMIN,
                                    pass: process.env.EMAIL_PASS
                                },
                            })

                            const mailOptions = {
                                from: process.env.EMAIL_ADMIN,
                                to: email,
                                subject: '登入驗證信',
                                html: '<h2>尊敬的' + name + '您好，您的登入驗證碼為「' + verifycode + '」有效期限為1分鐘，若不是您本人請不要將此驗證碼透漏給任何人，謝謝。</h2>'
                            }

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.log(error);
                                }
                                console.log(name + '驗證信件已寄送');
                            })

                        } catch (error) {
                            console.log(error);
                        }
                    }
                    const updatedUser = await User.findById(user._id)
                    await sendVertifyMail(updatedUser.name, updatedUser.email, updatedUser._id, updatedUser.VertifyCode)
                    res.redirect('/otpverify')
                }
            }

        }


    } catch (error) {
        console.log(error);
    }
}

//驗證碼過期
exports.verify = async (req, res) => {
    const verifycode = req.body.verifycode

    const token = req.cookies.jwt;
    if (!token) {
        return res.render('otpverify', { message: '查無登入帳戶！' })
    }
    const userID = jwt.decode(token).id;
    const user = await User.findById(userID)

    if (!user) {
        return res.render('otpverify', { message: '查無登入帳戶！' })
    }
    const publicKey = user.publicKey

    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, async (err, decodetoken) => {

        if (err) {
            console.log(err);
        }
        if (verifycode != user.VertifyCode) {
            return res.render('otpverify', { user: decodetoken, message: '驗證碼錯誤！' })
        } else if (Date.now() > user.VertifyExpireTime) {
            return res.render('otpverify', { user: decodetoken, message: '驗證碼已過期！' })
        } else {
            await User.updateOne({ _id: userID }, { $set: { VertifyCodeBoolean: true } })
            console.log(user.name, '登入並驗證成功');
            res.redirect('/loginsuccess')
        }
    })
}

//登出
exports.logout = async (req, res) => {
    await User.updateOne({ _id: jwt.decode(req.cookies.jwt).id }, { $set: { VertifyCodeBoolean: false } })
    res.cookie('jwt', '', { expires: new Date(0), httpOnly: true });
    res.redirect('/');
}

//修改個人資料
exports.modifyperson = async (req, res) => {
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
                const verifycodeboolean = user.VertifyCodeBoolean
                if (verifycodeboolean === false) {
                    return res.redirect('/')
                }
                const form = new multiparty.Form({ uploadDir: './uploads' });

                function saveFile(file) {

                    const originalFilename = decodedToken.email + '.png';
                    const targetPath = path.join('./uploads', originalFilename);

                    // 創建可讀流
                    const sourceStream = fs.createReadStream(file.path);

                    //創建可寫流
                    const destStream = fs.createWriteStream(targetPath);

                    // 管道讀寫操作
                    sourceStream.pipe(destStream);


                    sourceStream.on('end', function () {
                        fs.unlinkSync(file.path);
                        console.log('File saved successfully: ' + targetPath);
                    });

                    sourceStream.on('error', function (err) {
                        console.log('Error saving file: ' + err.message);
                    });


                }

                form.parse(req, async (err, fields, files) => {
                    if (err) {
                        console.log('Error parsing form: ' + err.message);
                        return;
                    }


                    // 處理每個上傳文件
                    Object.keys(files).forEach(async function (fieldName) {
                        const file = files[fieldName][0];

                        if (file.originalFilename == '') {
                            fs.unlinkSync(file.path);
                            return
                        } else {
                            saveFile(file);
                            await User.updateOne({ _id: userId }, { $set: { filename: decodedToken.email + '.png' } })
                        }

                    });


                    const instructioninput = fields.instructioninput[0];
                    const sexchoose = fields.sexchoose[0];
                    const phonenumber = fields.phonenumber[0];
                    const adress = fields.adress[0];

                    await User.updateOne({ _id: userId }, { $set: { SimpleIntroduce: instructioninput, Sex: sexchoose, PhoneNumber: phonenumber, Adress: adress } })


                    res.redirect('/personal')
                });

            })
        }
    }

}

//尋找好友
exports.searchfriend = async (req, res) => {
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

                const searchfriend = req.body.searchcontent

                if (searchfriend === '') {
                    console.log('沒有輸入東西');
                    return res.redirect('/addfriendpage')

                } else {
                    const results = await User.find({ name: { $regex: searchfriend } })
                    if (!results || results.length === 0) {
                        console.log('沒有找到');
                        return res.redirect('/addfriendpage')
                    } else {
                        console.log("搜尋到「" + results.length + "」個結果");
                        const divElements = await Promise.all(results.map(async (result, index) => {
                            const friendreqfriend = result.reqfriend || []
                            const my = await User.findOne({ email: decodedToken.email })
                            const myfriendreqfriend = my.reqfriend || []
                            const alreadyapply = friendreqfriend.includes(decodedToken.email.toLowerCase()); //我對他的請求狀態：
                            const alreadyapply2 = myfriendreqfriend.includes(result.email.toLowerCase()); //他對我的請求狀態：

                            const alreadyfriend = result.friends.includes(decodedToken.email.toLowerCase());
                            const alreadyfriend2 = my.friends.includes(result.email.toLowerCase());


                            result.SimpleIntroduce = result.SimpleIntroduce || '這個人很懶什麼都沒寫'
                            if (result.email === decodedToken.email) {

                            } else {

                                if (alreadyfriend === true | alreadyfriend2 === true) {
                                    if (result.filename == '' || result.filename === undefined) {
                                        return `<div class="list">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                        class="bi bi-person-fill-check icon" viewBox="0 0 16 16" id="noicon">
                                        <path
                                            d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                        <path
                                       d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                        </svg>
                                        <nobr>${result.name}</nobr>&emsp;&emsp;
                                        <font>${result.SimpleIntroduce}</font>
                                        <div id="reqfriendbtn" style="color:white;background-color: green;"><nobr style="color:white;">已是好友</nobr></div>
                                        </div>
                                        `;
                                    } else {
                                        return `<div class="list">
                                        <img src="/uploads/${result.filename}" width="100px">
                                        <nobr>${result.name}</nobr>&emsp;&emsp;
                                        <font>${result.SimpleIntroduce}</font>
                                        <div id="reqfriendbtn" style="color:white;background-color: lightgreen;"><nobr style="color:white;">已是好友</nobr></div>
                                        </div>
                                        `;
                                    }

                                } else {
                                    if (result.filename == '' || result.filename === undefined) {
                                        if (alreadyapply === true | alreadyapply2 === true) {
                                            return `<div class="list">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                            class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                            <path
                                                d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                            <path
                                           d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                            </svg>
                                            <nobr>${result.name}</nobr>&emsp;&emsp;
                                            <font>${result.SimpleIntroduce}</font>
                                            <div id="reqfriendbtn" style="color:white;background-color: gray;"><nobr style="color:white;">已申請</nobr></div>
                                            </div>
                                            `;
                                        } else {
                                            return `<div class="list">
                                                     <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                                     class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                                     <path
                                                         d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                                     <path
                                                    d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                                     </svg>
                                                     <nobr>${result.name}</nobr>&emsp;&emsp;
                                                     <font>${result.SimpleIntroduce}</font>
                                                     <div id="reqfriendbtn" onclick="subreqfriend.click()">+好友</div>
                                                     <form action="/auth/reqfriendform" method="POST">
                                                     <input type="email" style="display: none;" name="friendemail" value="${result.email}" readonly> 
                                                        <input type="submit" style="display: none;" id="subreqfriend" onclick="forwardreqfrirnd('${decodedToken.email}')">
                                                      </form>  
                                                </div>
                                                `;
                                        }

                                    } else {
                                        if (alreadyapply === true | alreadyapply2 === true) {
                                            return `<div class="list">
                                            <img src="/uploads/${result.filename}" width="100px">
                                            <nobr>${result.name}</nobr>&emsp;&emsp;
                                            <font>${result.SimpleIntroduce}</font>
                                            <div id="reqfriendbtn" style="color:white;background-color: gray;"><nobr style="color:white;">已申請</nobr></div>
                                            </div>
                                            `;
                                        } else {
                                            return `<div class="list">
                                        <img src="/uploads/${result.filename}" width="100px">
                                        <nobr>${result.name}</nobr>&emsp;&emsp;
                                        <font>${result.SimpleIntroduce}</font>
                                        <div id="reqfriendbtn" onclick="subreqfriend.click()">+好友</div>
                                                     <form action="/auth/reqfriendform" method="POST">
                                                     <input type="email" style="display: none;" name="friendemail" value="${result.email}" readonly>   
                                                     <input type="submit" style="display: none;" id="subreqfriend" onclick="forwardreqfrirnd('${decodedToken.email}')">
                                                      </form>  
                                        </div>
                                        `;
                                        }
                                    }
                                }
                            }

                        }));
                        const allresults = divElements.join('');
                        req.session.searchfriend = allresults
                        res.redirect('/addfriendpage')
                    }
                }
            })
        }
    }
}

//申請好友
exports.reqfriendform = async (req, res) => {
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

                const useremail = decodedToken.email
                const reqfriendemail = req.body.friendemail
                const friend = await User.findOne({ email: reqfriendemail })
                console.log(req.body);
                const havereqfriend = friend.reqfriend.includes(useremail.toLowerCase())
                if (useremail === reqfriendemail) {
                    return res.redirect('/addfriendpage')
                } else if (havereqfriend) {
                    return res.redirect('/addfriendpage')
                } else {
                    await User.findOneAndUpdate({ email: reqfriendemail }, { $addToSet: { reqfriend: useremail } },
                        { new: true })
                    req.session.searchfriend = []
                    return res.redirect('/addfriendpage')
                }

            })
        }
    }
}

//聯絡我們
exports.contact = async (req, res) => {
    const { contacttit, classify, degree, contactmsg } = req.body

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

                    const sendVertifyMail = async (name, email, userid, contacttit, classify, degree, contactmsg) => {
                        try {
                            const transporter = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 587,
                                secure: false,
                                requireTLS: true,
                                auth: {
                                    user: process.env.EMAIL_ADMIN,
                                    pass: process.env.EMAIL_PASS
                                },
                            })

                            const mailOptions = {
                                from: process.env.EMAIL_ADMIN,
                                to: process.env.EMAIL_ADMIN,
                                subject: '聯絡我們',
                                html: '<h2>來自' + name + '的聯絡信件，主旨為：' + contacttit + '，分類為：' + classify + '，優先度為：' + degree + '，內容為：' + contactmsg + '</h2>'
                            }

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.log(error);
                                }
                                console.log(name + '的聯絡信件已寄送');
                            })

                        } catch (error) {
                            console.log(error);
                        }
                    }
                    const newcontact = new Contact({
                        name: user.name,
                        email: user.email,
                        title: contacttit,
                        classify: classify,
                        degree: degree,
                        content: contactmsg,
                        reply: '尚未回覆',
                        replystatus: 'No'
                    })
                    await newcontact.save()
                    const updatedUser = await User.findById(user._id)
                    await sendVertifyMail(updatedUser.name, updatedUser.email, updatedUser._id, contacttit, classify, degree, contactmsg)
                    res.redirect('/reply')
                })
            }
        }


    } catch (error) {
        console.log(error);
    }
}
