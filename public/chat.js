

var friendbtn = document.getElementById('friendbtn')
var messagebtn = document.getElementById('messagebtn')
var addbtn = document.getElementById('addbtn')
var reqapply = document.getElementById('reqapply')
var bottombar = document.getElementById('bottombar')


var subicon = document.getElementById('subicon')
var subsearch = document.getElementById('subsearch')


var subreqfriend = document.getElementById('subreqfriend')

//側邊欄功能

searchicon.addEventListener('click', (e) => {
    searchcontent.classList.toggle('active')
});


var arrforupdate = document.getElementById('arrforupdate')

window.onload = function () {
    controllers.innerHTML = muens.map((item) => {
        return `<div class="controllbtn" onclick="location.href='${item.link}'">
        ${item.icon}
        <nobr>${item.name}</nobr>
    </div>`;
    }).join('');

    arrforupdate.innerHTML += updatehistory.map((item) => {
        return `
            <div class="arr">
                <h3>${item.tit}</h3>
                <p>${item.content}</p>
            </div>
        `
    }).join('');
}

//開啟觸發事件
controllbtn.addEventListener('click', (e) => {
    btns.innerHTML = muens.map((item) => {
        return `<div class="btn" onclick="location.href='${item.link}'">
        ${item.icon}
        <nobr>${item.name}</nobr>
    </div>`;
    }).join('');

    hidesidebar.style.display = 'block'
    hidesidebar.style.animation = 'sidebaranimation 0.5s ease forwards'
    btns.style.display = 'grid'
    state = 1;
    var rows = muens.length / 2;
    btns.style.gridAutoRows = `repeat(${rows}, 1fr)`
});

//關閉觸發事件
closebtn.addEventListener('click', (e) => {
    hidesidebar.style.display = 'none'
    btns.style.display = 'none'
    state = 0;
});



