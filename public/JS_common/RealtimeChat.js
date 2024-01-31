const socket = io.connect('https://localhost:5555');

var bottomlist = document.getElementById('bottomlist');
var bottomfrienslist = document.getElementById('bottomfrienslist');
var innercontent = document.getElementById('innercontent');
var chatroomlists = document.getElementById('chatroomlists');

//同意申請好友
function acceptfunction(email) {
    if (confirm("確定要接受好友邀請嗎?")) {
        socket.emit('accept', { email: email });
        socket.emit('updatefriend', { email: email });
    } else {
        return;
    }
}

//拒絕好友邀請
function refusefunction(email) {
    if (confirm("確定要拒絕好友邀請嗎?")) {
        socket.emit('refuse', { email: email });
    } else {
        return;
    }
}

//申請好友
function forwardreqfrirnd(myemail) {
    socket.emit('forwardreqfrirnd', { myemail: myemail });
}

//刪除好友
function deletefunction(email) {
    if (confirm("確定要刪除好友嗎?")) {
        socket.emit('deletefriend', { email: email });
        socket.emit('updatefrienddelete', { email: email });
    } else {
        return;
    }
}

//進入聊天室
function chatfunction(email) {
    window.location.href = `/chatroom?friendmail=${email}`
    socket.emit('accesschatroom', { email: email, meemail: user.email });
}

//離開聊天室
function backpage(email) {
    window.location.href = '/chatroomchoose'
    socket.emit('exitchatroom', { email: email });
}

//按下送出訊息
function sendmsg(email) {
    let mymsg = document.getElementById('mymsg').value;
    socket.emit('sendmsg', { email: email, mymsg: mymsg });
    document.getElementById('mymsg').value = '';
}

//按下enter鍵送出訊息
window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "Enter":
            document.getElementById('sendmsgbtn').click();
            break;
    }
});

//即時「接受」好友請求
socket.on('accept', function (data) {
    const friend = document.getElementById(`${data.email}`);
    friend.remove();
});

//即時「拒絕」好友請求
socket.on('refuse', function (data) {
    const friend = document.getElementById(`${data.email}`);
    friend.remove();
});

//即時更新「申請好友」列表
socket.on('forwardreqfrirnd', function (data) {
    if (data.myemail.filename == undefined || data.myemail.filename == null) {
        bottomlist.innerHTML += `
        <div class="applylist" id="${data.myemail.email}">
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
            class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
            <path
            d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
            <path
            d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
            </svg>
            <nobr>${data.myemail.name}</nobr>&emsp;&emsp;
            <div class="applylistbutton">
            <button class="accept" onclick="acceptfunction('${data.myemail.email}')"><nobr style="color:white;">接受</nobr></button>
            <button class="refuse" onclick="refusefunction('${data.myemail.email}')"><nobr style="color:white;">拒絕</nobr></button>
            </div>
        </div>
        `
    } else {
        bottomlist.innerHTML += `
    <div class="applylist" id="${data.myemail.email}">
        <img src="/uploads/${data.myemail.filename}" width="100px" style="border-radius:50%;">
        <nobr>${data.myemail.name}</nobr>&emsp;&emsp;
        <div class="applylistbutton">
        <button class="accept" onclick="acceptfunction('${data.myemail.email}')"><nobr style="color:white;">接受</nobr></button>
        <button class="refuse" onclick="refusefunction('${data.myemail.email}')"><nobr style="color:white;">拒絕</nobr></button>
        </div>
    </div>
    `;
    }

})

//即時「刪除」好友
socket.on('deletefriend', function (data) {
    const friend = document.getElementById(`${data.email}`);
    friend.remove();
})

//即時更新「好友」列表
socket.on('updatefriendforward', function (data) {
    if (data.myreqfriend.filename == undefined || data.myreqfriend.filename == null) {
        bottomfrienslist.innerHTML += `<div class="friend" id="${data.myreqfriend.email}">
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
        class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
        <path
        d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
        <path
        d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
        </svg>
        <nobr>${data.myreqfriend.name}</nobr>&emsp;&emsp;
        <div class="friendbutton">
        <button class="chat" onclick="chatfunction('${data.myreqfriend.email}')"><nobr style="color:black;">聊天</nobr></button>
        <button class="delete" onclick="deletefunction('${data.myreqfriend.email}')"><nobr style="color:white;">刪除</nobr></button>
        </div>
    </div>`;
    } else {
        bottomfrienslist.innerHTML += `
            <div class="friend" id="${data.myreqfriend.email}">
                <img src="/uploads/${data.myreqfriend.filename}" width="100px" style="border-radius:50%;"><nobr
                style="color:black;">${data.myreqfriend.name}</nobr>&emsp;&emsp;
                <div class="friendbutton">
                    <button class="chat" onclick="chatfunction('${data.myreqfriend.email}')"><nobr style="color:black;">聊天</nobr></button>
                    <button class="delete" onclick="deletefunction('${data.myreqfriend.email}')"><nobr style="color:white;">刪除</nobr></button>
                </div>
            </div>`;
    }
})

//即時更新好友刪除列表
socket.on('updatefrienddeleteforward', function (data) {
    var friend = document.getElementById(`${data.myreqfriend}`);
    bottomfrienslist.removeChild(friend);
})

//即時更新聊天訊息
socket.on('updatesendmsg', function (data) {

    let myname = data.myname;
    let senderemail = data.senderemail;
    let mytokenemail = data.mytokenemail;
    let myimg = data.myimg;
    let mymsg = data.mymsg;
    let msgfortime = data.msgfortime;
    let friendname = data.friendname;
    let receiveremail = data.receiveremail;
    let friendimg = data.friendimg;
    var currentURL = window.location.href.split('?')[1].split('=')[1];

    if (currentURL != senderemail) {
        innercontent.innerHTML += `
                                     <div class="mymsg">
                                         <div class="mymsgtime">
                                             ${msgfortime}
                                         </div>
                                         <div class="mymsgtext">
                                              ${mymsg}
                                         </div>
                                     </div>
                                    `
    } else {
        if (myimg == undefined || myimg == null || myimg == '') {
            innercontent.innerHTML += `
                                            <div class="yourmsg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="gray"
                                                class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                                <path
                                                d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                                <path
                                                d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                                </svg>
                                                <div class="friendname">
                                                    <nobr>${myname}</nobr>
                                                </div>
                                                <div class="yourmsgtext">
                                                    ${mymsg}
                                                </div>
                                                <div class="yourmsgtime">
                                                    ${msgfortime}
                                                </div>
                                            </div>
                                        `;

        } else {
            innercontent.innerHTML += `<div class="yourmsg">
                                                <img src="/uploads/${myimg}">
                                                <div class="friendname">
                                                    <nobr>${myname}</nobr>
                                                </div>
                                                <div class="yourmsgtext">
                                                    ${mymsg}
                                                </div>
                                                <div class="yourmsgtime">
                                                    ${msgfortime}
                                                </div>
                                            </div>`
        }
    }





})

//即時更新聊天訊息列表
socket.on('updatesendmsglistforward', function (data) {

    const length = data.length
    const newestmsg = data.chathistorylist.messages[length - 1].content
    const timestamp = data.newtime
    const myemail = data.myemail
    const myimg = data.myimg
    const myname = data.myname
    console.log("朋友信箱：" + myemail);
    console.log("朋友名稱：" + myname);
    console.log(data);


    //如果監聽到div id=朋友信箱，就不新增，只針對內容做更新
    if (document.getElementById(`${myemail}`) != null) {
        const friend = document.getElementById(`${myemail}`);
        friend.remove();
        if (myimg == undefined || myimg == null || myimg == '') {
            chatroomlists.innerHTML += `<div class="roomlist" id="${myemail}" onclick="chatfunction('${myemail}')" >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                    class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                    <path
                                    d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                    <path
                                    d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                    </svg>
                                    <div class="roomdetail">
                                        <div class="roomlistcontentname">
                                            <nobr>${myname}</nobr>
                                        </div>
                                        <div class="roomlistcontentmessage">
                                            <nobr>${newestmsg}</nobr>
                                        </div>
                                    </div>
                                    <div class="newmegtime">
                                        <nobr>${timestamp}</nobr>
                                    </div>                         
                                </div>
                             `
        } else {
            chatroomlists.innerHTML += `<div class="roomlist" id="${myemail}" onclick="chatfunction('${myemail}')">
                                            <div class="roomlistcontentimg">
                                                <img src="/uploads/${myimg}">
                                            </div>
                                            <div class="roomdetail">
                                                <div class="roomlistcontentname">
                                                    <nobr>${myname}</nobr>
                                                </div>
                                                <div class="roomlistcontentmessage">
                                                    <nobr>${newestmsg}</nobr>
                                                </div>
                                            </div>
                                            <div class="newmegtime">
                                                <nobr>${timestamp}</nobr>
                                            </div>

                                        </div>`
        }


    } else {
        if (myimg == undefined || myimg == null || myimg == '') {
            chatroomlists.innerHTML += `<div class="roomlist" id="${myemail}" onclick="chatfunction('${myemail}')" >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="gray"
                                    class="bi bi-person-fill-exclamation icon" viewBox="0 0 16 16" id="noicon">
                                    <path
                                    d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4" />
                                    <path
                                    d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                                    </svg>
                                    <div class="roomdetail">
                                        <div class="roomlistcontentname">
                                            <nobr>${myname}</nobr>
                                        </div>
                                        <div class="roomlistcontentmessage">
                                            <nobr>${newestmsg}</nobr>
                                        </div>
                                    </div>
                                    <div class="newmegtime">
                                        <nobr>${timestamp}</nobr>
                                    </div>                         
                                </div>
                            `
        } else {
            chatroomlists.innerHTML += `<div class="roomlist" id="${myemail}" onclick="chatfunction('${myemail}')">
                                            <div class="roomlistcontentimg">
                                                <img src="/uploads/${myimg}">
                                            </div>
                                            <div class="roomdetail">
                                                <div class="roomlistcontentname">
                                                    <nobr>${myname}</nobr>
                                                </div>
                                                <div class="roomlistcontentmessage">
                                                    <nobr>${newestmsg}</nobr>
                                                </div>
                                            </div>
                                            <div class="newmegtime">
                                                <nobr>${timestamp}</nobr>
                                            </div>
                                        </div>`
        }


    }


})
