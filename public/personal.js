//側邊欄功能

searchicon.addEventListener('click', (e) => {
    searchcontent.classList.toggle('active')
});

window.onload = function () {
    controllers.innerHTML = muens.map((item) => {
        return `<div class="controllbtn" onclick="location.href='${item.link}'">
        ${item.icon}
        <nobr>${item.name}</nobr>
    </div>`;
    }).join('');
}

//開啟觸發事件
controllbtn.addEventListener('click', (e) => {
    console.log(123);
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

//螢幕寬度及時監聽

window.addEventListener('resize', (e) => {
    var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (screenWidth < 800 && state == 1) {
        btns.style.display = 'grid'      //側邊欄面板
    }

    if (screenWidth > 800 && state == 1) {
        btns.style.display = 'none'
    }
});


var instructioninput = document.getElementById('instructioninput');
var sexchoose = document.getElementById('sexchoose')
var phonenumber = document.getElementById('phonenumber')
var adress = document.getElementById('adress')
var personimginput = document.getElementById('personimginput')
var personimg = document.getElementById('personimg')

var filldata = document.getElementById('filldata')
var submitpersondata = document.getElementById('submitpersondata')

filldata.addEventListener('click', (e) => {
    instructioninput.disabled = false;
    sexchoose.disabled = false;
    phonenumber.disabled = false;
    adress.disabled = false;
    submitpersondata.style.background = 'rgb(253, 101, 74)'
    submitpersondata.disabled = false;
    personimginput.disabled = false;
})

personimg.addEventListener('click', (e) => {
    personimginput.click()
})
