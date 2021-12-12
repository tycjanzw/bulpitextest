const express = require('express');
const {createServer} = require('https');
const {readFileSync} = require('fs');
const {Server} = require('socket.io');
const PORT = process.env.PORT || 2255;

var tablicaKodow = [];

const app = express();
//const robot = require('robotjs');   
const {mouse, keyboard, Point, straightTo, Button, Key} = require("@nut-tree/nut-js");

const httpServer = createServer({
    key: readFileSync('cert/key.pem'),
    cert: readFileSync('cert/cert.pem')
}, app);

/*const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(httpServer, {
    debug: false,
});
app.use("/peerjs", peerServer);*/

var screenSize;

app.use('/static', express.static('./static/'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/indexR.html');
});

const io = new Server(httpServer,{ });

io.on('connection', (socket) => {
    let isMouseDown = false;
    
    /*socket.on('disconnect', () => {
        //io.emit('getGode');
        //console.log(code);
        //socket.on('sendCodeToClose', data=>{
        //});
        console.log('rozloczono');
    });*/

    // USTAWIENIE ROZMIARU EKRANU
    socket.on('sendScreenSize', scrSize=>{
        screenSize = scrSize;
    });

    // WYSŁANIE POŁOŻENIE MYSZKI 
    socket.on('sendCoords',data=>{
        // WYSŁANIE POŁOŻENIA MYSZKI
        io.emit('setCoordsToDiv',data);
    });

    // USTAWIENIE X-Y Z INPUTÓW
    socket.on('sendCoordsFromInputs', data=>{
        //robot.moveMouse(data.x,data.y);
        try {
            mouse.move(straightTo(new Point(data.x,data.y)));
        } catch (error) {
            console.log(error);
        }
    });

    // USTAWIENIE POŁOŻENIE Z PRZESUNIĘCIA MYSZKI
    socket.on('sendCoordFromMouseMove', data=>{
        try {
            //robot.moveMouse(Math.round(screenSize.wi/data.w*data.x),Math.round(screenSize.he/data.h*data.y)); 
            mouse.move(straightTo(new Point(Math.floor(screenSize.wi/data.w*data.x),Math.floor(screenSize.he/data.h*data.y))));
        } catch (error) {
            console.log('nie ma stream`a, lub błąd');
        }
    });

    // KLIKNIĘCIE LEWYM PRZYCISKIEM MYSZKI
    socket.on('sendLeftClick',()=>{
        //robot.mouseClick();
        mouse.leftClick();
    });

    // KLIKNIĘCIE PRAWYM PRZYCISKIEM MYSZKI
    socket.on('sendRightClick',()=>{
        //robot.mouseClick('right');
        mouse.rightClick();
    });

    // KLIKNIĘCIE ŚRODKOWYM PRZYCISKIEM MYSZKI
    socket.on('sendScrollClick', () => {
        //robot.mouseClick('middle');
    });

    // KLIKNIĘCIE LEWYM PRZYCISKIEM MYSZKI x2
    socket.on('sendDoubleClick',() => {
        //robot.mouseClick('left',true);
        for(let i=0; i<2; i++){
            mouse.leftClick();
        }
    });

    // KLIKNIĘCIE KLAWISZEM
    socket.on('sendPressKey', keyData=>{
        //console.log(keyData.k);
        //pressKey(keyData.k);
        setKeyToogle(keyData.k, "down");
    });

    // ZWOLNIENIE KLAWISZEM
    socket.on('sendUpKey', keyData=>{
        //upKey(keyData.k);
        setKeyToogle(keyData.k, "up");
    });

    // WYSŁANIE KODU
    socket.on('sendCode',code => {
        console.log(tablicaKodow.length);
        tablicaKodow.push([code.p,1]);
        //console.log(code.p);
        //tablicaKodow.forEach(test);
        for(let i=0; i<tablicaKodow.length; i++){
            console.log(tablicaKodow[i][0]+" "+tablicaKodow[i][1]);
        }
    });

    // WYSLANIE KODU DO GOSPODARZA
    socket.on('getCodeToCreatred', kod=>{
        io.emit('sendCodeToCreatred', {c: kod.c});
    });

    // SPRAWDZANIE KODU
    socket.on('checkCode', code => {
        var countOfCodes = 0;
        var index;
        if(tablicaKodow.length == 0){
            io.emit('codeResult',{r: false});
        }
        else{
            for(let i=0; i < tablicaKodow.length; i++){
                if(code.c == tablicaKodow[i][0]){
                    countOfCodes += 1;
                    index = i;
                    i=tablicaKodow.length;
                }
            }
            if(countOfCodes==1){
                tablicaKodow[index][1]+=1;
                for(let i=0; i<tablicaKodow.length; i++){
                    console.log(tablicaKodow[i][0]+" "+tablicaKodow[i][1]);
                }
                io.emit('codeResult',{r: true});
            }
            else{
                io.emit('codeResult',{r: false});
            }
        }
    });

    // USUNIECIE KODU
    socket.on('removeCode', code=>{
        for (let i = 0; i < tablicaKodow.length; i++) {
            if(tablicaKodow[i][0] == code.c){
                tablicaKodow.splice(i, 1);
            }
        }

        io.emit('refresh');
    });

    // TEST
    socket.on('testCords', dane=>{
        console.log(dane.x+" "+dane.y);
    })

    // ZAKOŃCZENIE STREAMOWANIA OBRAZU
    socket.on('sendEndStream',()=>{
        io.emit('endStream',{r:true});
    });

    // USTAWIENIE SCROLL MYSZKI - NIEDZIAŁAJĄCE
    socket.on('sendScrool',scrollData=>{
        //console.log(Math.round(scrollData.s));
        console.log(scrollData.s);
        var y = scrollData.s > 0 ? 3 : -3; 
        var valY = scrollData.s;
        //console.log(y);
        //robot.scrollMouse(0, valY);
        mouse.scrollDown(-10);
        //robot.scrollMouse(0, -Math.round(scrollData.s));
    });

    // SCROLL MYSZKI - DZIAŁAJĄCE
    socket.on('scroll', delta => {
        //robot.scrollMouse(delta.x, delta.y);
        mouse.scrollDown(delta.y);
    });

    // PRZYTRZYMANIE MYSZKI
    socket.on('mouseDown', mouseData=>{
        isMouseDown = mouseData.m;
        //robot.mouseToggle("down");'
        mouse.pressButton(Button.LEFT);
    });

    // ZWOLNIENIE PRZYTRZYMANIA MYSZKI
    socket.on('mouseUp', mouseData=>{
        isMouseDown = mouseData.m;
        //robot.mouseToggle("up");
        //mouse.releaseButton(Button.LEFT);
    });

    /*socket.on('sendCoordMouseToDrag', dragData=>{
        while(isMouseDown){
            //console.log('is down');
            robot.moveMouse(Math.round(screenSize.wi/dragData.w*dragData.x),Math.round(screenSize.he/dragData.h*dragData.y));
        }
        robot.mouseToggle("up");
    });*/

    // KOD TEST
    socket.on('codeRequest',()=>{
        io.emit('sendGenerateCode', {c: generateCode()});
    });

});

httpServer.listen(PORT);

/*function clickKey(key){
    if(key === 'Enter'){ 
        try {
            robot.keyTap("enter");
        } catch (error) {
            console.log(error);
        }
    }
    else if(key === 'Backspace'){
        robot.keyTap("backspace");
    }
    else if(key === 'Delete'){
        robot.keyTap("delete");
    }
    else if(key === 'Escape'){
        robot.keyTap("escape");
    }
    else if(key === 'ArrowUp'){
        robot.keyTap("up");
    }
    else if(key === 'ArrowDown'){
        robot.keyTap("down");
    }
    else if(key === 'ArrowLeft'){
        robot.keyTap("left");
    }
    else if(key === 'ArrowRight'){
        robot.keyTap("right");
    }
    else if(key === 'Control'){
        robot.keyTap("control");
    }
    else if(key === 'Alt'){
        robot.keyTap("alt");
    }
    else if(key === 'AltGraph'){
        robot.keyTap("alt");
    }
    else if(key === 'Shift'){
        robot.keyTap("shift");
    }
    else{ 
        robot.keyTap(key); 
    }
}
*/



/*function pressKey(key){
    if(key === 'Enter'){ 
        try {
            robot.keyToggle("enter", "down");
        } catch (error) {
            console.log(error);
        }
    }
    else if(key === 'Backspace'){
        robot.keyToggle("backspace", "down");
    }
    else if(key === 'Delete'){
        robot.keyToggle("delete", "down");
    }
    else if(key === 'Escape'){
        robot.keyToggle("escape", "down");
    }
    else if(key === 'Tab'){
        robot.keyToggle("tab", "down");
    }
    else if(key === 'ArrowUp'){
        robot.keyToggle("up", "down");
    }
    else if(key === 'ArrowDown'){
        robot.keyToggle("down", "down");
    }
    else if(key === 'ArrowLeft'){
        robot.keyToggle("left", "down");
    }
    else if(key === 'ArrowRight'){
        robot.keyToggle("right", "down");
    }
    else if(key === 'Control'){
        robot.keyToggle("control", "down");
    }
    else if(key === 'Alt'){
        robot.keyToggle("alt", "down");
    }
    else if(key === 'AltGraph'){
        robot.keyToggle("alt", "down");
    }
    else if(key === 'Shift'){
        robot.keyToggle("shift", "down");
    }
    else if(key === 'F1'){
        robot.keyToggle("f1", "down");
    }
    else if(key === 'F2'){
        robot.keyToggle("f2", "down");
    }
    else if(key === 'F3'){
        robot.keyToggle("f3", "down");
    }
    else if(key === 'F4'){
        robot.keyToggle("f4", "down");
    }
    else if(key === 'F5'){
        robot.keyToggle("f5", "down");
    }
    else if(key === 'F6'){
        robot.keyToggle("f6", "down");
    }
    else if(key === 'F7'){
        robot.keyToggle("f7", "down");
    }
    else if(key === 'F8'){
        robot.keyToggle("f8", "down");
    }
    else if(key === 'F9'){
        robot.keyToggle("f9", "down");
    }
    else if(key === 'F10'){
        robot.keyToggle("f10", "down");
    }
    else if(key === 'F11'){
        robot.keyToggle("f11", "down");
    }
    else if(key === 'F12'){
        robot.keyToggle("f12", "down");
    }
    else if(key == 'PageUp'){
        robot.keyToggle("pageup", "down");
    }
    else if(key == 'PageDown'){
        robot.keyToggle("pagedown", "down");
    }
    else if(key == 'Home'){
        robot.keyToggle("home", "down");
    }
    else if(key == 'End'){
        robot.keyToggle("end", "down");
    }
    else{ 
        try {
            robot.keyToggle(key, "down"); 
        } catch (error) {
            console.log('Nie obsłużono klawisza: '+key);
        }
    }
}

function upKey(key){
    if(key === 'Enter'){ 
        try {
            robot.keyToggle("enter", "up");
        } catch (error) {
            console.log(error);
        }
    }
    else if(key === 'Backspace'){
        robot.keyToggle("backspace", "up");
    }
    else if(key === 'Delete'){
        robot.keyToggle("delete", "up");
    }
    else if(key === 'Escape'){
        robot.keyToggle("escape", "up");
    }
    else if(key === 'Tab'){
        robot.keyToggle("tab", "up");
    }
    else if(key === 'ArrowUp'){
        robot.keyToggle("up", "up");
    }
    else if(key === 'ArrowDown'){
        robot.keyToggle("down", "up");
    }
    else if(key === 'ArrowLeft'){
        robot.keyToggle("left", "up");
    }
    else if(key === 'ArrowRight'){
        robot.keyToggle("right", "up");
    }
    else if(key === 'Control'){
        robot.keyToggle("control", "up");
    }
    else if(key === 'Alt'){
        robot.keyToggle("alt", "up");
    }
    else if(key === 'AltGraph'){
        robot.keyToggle("alt", "up");
    }
    else if(key === 'Shift'){
        robot.keyToggle("shift", "up");
    }
    else if(key === 'F1'){
        robot.keyToggle("f1", "up");
    }
    else if(key === 'F2'){
        robot.keyToggle("f2", "up");
    }
    else if(key === 'F3'){
        robot.keyToggle("f3", "up");
    }
    else if(key === 'F4'){
        robot.keyToggle("f4", "up");
    }
    else if(key === 'F5'){
        robot.keyToggle("f5", "up");
    }
    else if(key === 'F6'){
        robot.keyToggle("f6", "up");
    }
    else if(key === 'F7'){
        robot.keyToggle("f7", "up");
    }
    else if(key === 'F8'){
        robot.keyToggle("f8", "up");
    }
    else if(key === 'F9'){
        robot.keyToggle("f9", "up");
    }
    else if(key === 'F10'){
        robot.keyToggle("f10", "up");
    }
    else if(key === 'F11'){
        robot.keyToggle("f11", "up");
    }
    else if(key === 'F12'){
        robot.keyToggle("f12", "up");
    }
    else if(key == 'PageUp'){
        robot.keyToggle("pageup", "up");
    }
    else if(key == 'PageDown'){
        robot.keyToggle("pagedown", "up");
    }
    else if(key == 'Home'){
        robot.keyToggle("home", "up");
    }
    else if(key == 'End'){
        robot.keyToggle("end", "up");
    }
    else{ 
        try {
            robot.keyToggle(key, "up"); 
        } catch (error) {
            console.log('Nie obsłużono klawisza: '+key);
        }
    }
}
*/


// https://stackoverflow.com/questions/46814342/scrolltop-global-variable-not-updating-on-scroll


function generateCode(){
    var code = '';
    for(let i=0; i<10; i++){
        code += Math.floor(Math.random()*10);
    }
    return code;
}

/////////
/////////
/////////
/////////
/////////



function setKeyToogle(key, val){
    if(key === 'Enter'){ 
        try {
            //robot.keyToggle("enter", val);
            if(val == "down")
                keyboard.pressKey(Key.Enter);
            else
                keyboard.releaseKey(Key.Enter);
        } catch (error) {
            console.log(error);
        }
    }
    else if(key === 'Backspace'){
        //robot.keyToggle("backspace", val);
        if(val == "down")
            keyboard.pressKey(Key.Backspace);
        else
            keyboard.releaseKey(Key.Backspace);
    }
    else if(key === 'Delete'){
        //robot.keyToggle("delete", val);
        if(val == "down")
            keyboard.pressKey(Key.Delete);
        else
            keyboard.releaseKey(Key.Delete);
    }
    else if(key === 'Escape'){
        //robot.keyToggle("escape", val);
        if(val == "down")
            keyboard.pressKey(Key.Escape);
        else
            keyboard.releaseKey(Key.Escape);
    }
    else if(key === 'Tab'){
        //robot.keyToggle("tab", val);
        if(val == "down")
            keyboard.pressKey(Key.Tab);
        else
            keyboard.releaseKey(Key.Tab);
    }
    else if(key === 'ArrowUp'){
        //robot.keyToggle("up", val);
        if(val == "down")
            keyboard.pressKey(Key.Up);
        else
            keyboard.releaseKey(Key.Up);
    }
    else if(key === 'ArrowDown'){
        //robot.keyToggle("down", val);
        if(val == "down")
            keyboard.pressKey(Key.Down);
        else
            keyboard.releaseKey(Key.Down);
    }
    else if(key === 'ArrowLeft'){
        //robot.keyToggle("left", val);
        if(val == "down")
            keyboard.pressKey(Key.Left);
        else
            keyboard.releaseKey(Key.Left);
    }
    else if(key === 'ArrowRight'){
        //robot.keyToggle("right", val);
        if(val == "down")
        keyboard.pressKey(Key.Right);
    else
        keyboard.releaseKey(Key.Right);
    }
    else if(key === 'Control'){
        //robot.keyToggle("control", val);
        if(val == "down")
            keyboard.pressKey(Key.LeftControl);
        else
            keyboard.releaseKey(Key.LeftControl);
    }
    else if(key === 'Alt'){
        //robot.keyToggle("alt", val);
        if(val == "down")
            keyboard.pressKey(Key.LeftAlt);
        else
            keyboard.releaseKey(Key.LeftAlt);
    }
    else if(key === 'AltGraph'){
        //robot.keyToggle("alt", val);
        if(val == "down")
            keyboard.pressKey(Key.RightAlt);
        else
            keyboard.releaseKey(Key.RightAlt);
    }
    else if(key === 'Shift'){
        //robot.keyToggle("shift", val);
        if(val == "down")
            keyboard.pressKey(Key.LeftShift);
        else
            keyboard.releaseKey(Key.LeftShift);
    }
    else if(key === 'F1'){
        //robot.keyToggle("f1", val);
        if(val == "down")
            keyboard.pressKey(Key.F1);
        else
            keyboard.releaseKey(Key.F1);
    }
    else if(key === 'F2'){
        //robot.keyToggle("f2", val);
        if(val == "down")
            keyboard.pressKey(Key.F2);
        else
            keyboard.releaseKey(Key.F2);
    }
    else if(key === 'F3'){
        //robot.keyToggle("f3", val);
        if(val == "down")
            keyboard.pressKey(Key.F3);
        else
            keyboard.releaseKey(Key.F3);
    }
    else if(key === 'F4'){
        //robot.keyToggle("f4", val);
        if(val == "down")
            keyboard.pressKey(Key.F4);
        else
            keyboard.releaseKey(Key.F4);
    }
    else if(key === 'F5'){
        //robot.keyToggle("f5", val);
        if(val == "down")
            keyboard.pressKey(Key.F5);
        else
            keyboard.releaseKey(Key.F5);
    }
    else if(key === 'F6'){
        //robot.keyToggle("f6", val);
        if(val == "down")
            keyboard.pressKey(Key.F6);
        else
            keyboard.releaseKey(Key.F6);
    }
    else if(key === 'F7'){
        //robot.keyToggle("f7", val);
        if(val == "down")
            keyboard.pressKey(Key.F7);
        else
            keyboard.releaseKey(Key.F7);
    }
    else if(key === 'F8'){
        //robot.keyToggle("f8", val);
        if(val == "down")
            keyboard.pressKey(Key.F8);
        else
            keyboard.releaseKey(Key.F8);
    }
    else if(key === 'F9'){
        //robot.keyToggle("f9", val);
        if(val == "down")
            keyboard.pressKey(Key.F9);
        else
            keyboard.releaseKey(Key.F9);
    }
    else if(key === 'F10'){
        //robot.keyToggle("f10", val);
        if(val == "down")
            keyboard.pressKey(Key.F10);
        else
            keyboard.releaseKey(Key.F10);
    }
    else if(key === 'F11'){
        //robot.keyToggle("f11", val);
        if(val == "down")
            keyboard.pressKey(Key.F11);
        else
            keyboard.releaseKey(Key.F11);
    }
    else if(key === 'F12'){
        //robot.keyToggle("f12", val);
        if(val == "down")
            keyboard.pressKey(Key.F12);
        else
            keyboard.releaseKey(Key.F12);
    }
    else if(key == 'PageUp'){
        //robot.keyToggle("pageup", val);
        if(val == "down")
            keyboard.pressKey(Key.PageUp);
        else
            keyboard.releaseKey(Key.PageUp);
    }
    else if(key == 'PageDown'){
        //robot.keyToggle("pagedown", val);
        if(val == "down")
            keyboard.pressKey(Key.PageDown);
        else
            keyboard.releaseKey(Key.PageDown);
    }
    else if(key == 'Home'){
        //robot.keyToggle("home", val);
        if(val == "down")
            keyboard.pressKey(Key.Home);
        else
            keyboard.releaseKey(Key.Home);
    }
    else if(key == 'End'){
        //robot.keyToggle("end", val);
        if(val == "down")
            keyboard.pressKey(Key.End);
        else
            keyboard.releaseKey(Key.End);
    }
    else{ 
        try {
            //robot.keyToggle(key, val);
            if(val == "down")
                keyboard.type(key);
            //else
                //keyboard.releaseKey(key); 
        } catch (error) {
            console.log('Nie obsłużono klawisza: '+key);
        }
    }
}


