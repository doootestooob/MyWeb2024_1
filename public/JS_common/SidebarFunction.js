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
    welcome.style.zIndex = '-1'
    hidesidebar.style.display = 'block'
    hidesidebar.style.animation = 'sidebaranimation 0.5s ease forwards'
    btns.style.display = 'grid'
    state = 1;
    var rows = muens.length / 2;
    btns.style.gridAutoRows = `repeat(${rows}, 1fr)`
});

//關閉觸發事件
closebtn.addEventListener('click', (e) => {
    welcome.style.zIndex = '1'
    hidesidebar.style.display = 'none'
    btns.style.display = 'none'
    state = 0;
});