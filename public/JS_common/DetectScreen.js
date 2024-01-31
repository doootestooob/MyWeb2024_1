//螢幕寬度及時監聽

window.addEventListener('resize', (e) => {
    var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (screenWidth < 800 && state == 1) {
        welcome.style.zIndex = '-1'     //中間標題
        btns.style.display = 'grid'      //側邊欄面板
    }

    if (screenWidth > 800 && state == 1) {
        welcome.style.zIndex = '1'
        btns.style.display = 'none'   
    }
});