var socket = io();
        
var role='';
var isOnRemoteDiv = false;
var isfullScreen = false;
var code='';
var secondCode = '';

var isCreated = false;
var isJoiner = false;

var robot = null;

var input = document.getElementById('x');
var input2 = document.getElementById('y');
var roleVal = document.getElementById('roleData');
//var screen = document.getElementById('screenShare');
var screen = document.getElementById('remoteScreen');   

// OK
document.getElementById('form').addEventListener('click',function(){
    if(input.value && input2.value){
        socket.emit('sendCoordsFromInputs', {x:input.value, y:input2.value});
        input.value = '';
        input2.value = '';
    }
});

// OK
document.getElementById('setRole').addEventListener('click',function(e){
    var select = document.getElementById('roleSelected');
    var val = select.options[select.selectedIndex].value;
    role =val;
});

// OK
socket.on('setCoordsToDiv', function(data){
    $('#cords').html(data.x+" "+data.y);
});

jQuery.fn.single_double_click = function(single_click_callback, double_click_callback, timeout) {
    return this.each(function(){
        var clicks = 0, self = this;
        jQuery(this).click(function(event){
            clicks++;
            if (clicks == 1) {
                setTimeout(function(){
                if(clicks == 1) {
                    single_click_callback.call(self, event);
                } else {
                    double_click_callback.call(self, event);
                }
            clicks = 0;
            }, timeout || 300);
        }
    });
    });
}

document.getElementById('remoteScreen').addEventListener('mouseup', function(event){
    if(!screen.disabled){
        if(event.button == 1){
            socket.emit('sendScrollClick');
        }
        if (event.button == 2){
            socket.emit('sendRightClick');
        }
    }
});

$("#remoteScreen").single_double_click(function(event){
    if(!screen.disabled){
        var posX = $(this).offset().left;
        var posY = $(this).offset().top;
        
        var x = event.pageX - posX;
        var y = event.pageY - posY;
        if (event.button == 0){
            socket.emit('sendLeftClick');
        }
    }
},function(event){
    if(!screen.disabled){
        var posX = $(this).offset().left;
        var posY = $(this).offset().top;
        
        var x = event.pageX - posX;
        var y = event.pageY - posY;
        socket.emit('sendDoubleClick');
    }
});

socket.on('endStream',daneRozloczenia=>{
    if(daneRozloczenia.r){
        console.log('end');
        var v = document.getElementById('videoTest');
        if(v!=null){
            document.getElementById('remoteScreen').removeChild(v);
        }
    }
});

// RTCPeerConnection
//var myConnection, userConnection;

var configuration = {
    iceServers: [
        { urls: 'stun:stun.1.google.com:19302' },
        { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
    ] 
};

//const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ] });
/*myConnection = new RTCPeerConnection(configuration);
console.log(myConnection);

var send2 = myConnection.createDataChannel('sendChannel');
send2.onopen = function(){
    alert('ok');
}
send2.send('test');
myConnection.onopen = function(){
    alert('ok');
}

myConnection.onicecandidate = function(e){
    if (e.candidate) { 
        console.log({ 
           type: "candidate", 
           candidate: e.candidate 
        }); 
    } 
};*/

var peerCode = '';
/*var peer = new Peer(generateCode(),{
    config: {'iceServers': [
      { url: 'stun:stun.l.google.com:19302' },
      { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
    ]} 
    // Sample servers, please use appropriate ones /
});*/

//var peer = new Peer(generateCode());
var peer = new Peer(generateCode(), configuration);

var myStream;
var currentPeer;
var peerList = [];

$('#sendPeerCode').click(()=>{
    isCreated = true;
    //var kod = document.getElementById('showPeer').innerHTML;
    //peer = null;
    //peer = new Peer(generateCode());
    
    var kod = peer.id;
    alert(kod);
    document.getElementById('generatedCode').innerHTML = kod;
    
    document.getElementById('shareScreenBtn').disabled = false;
    document.getElementById('shareScreenBtn').addEventListener('click',()=>{
        if(secondCode!='' && secondCode!=' '){
            callPeer(secondCode);
        }
    });

    document.getElementById('disconnectBtn').disabled = false;
    document.getElementById('disconnectBtn').addEventListener('click', () => {
        //window.location.reload(true);
        //peer.close();
        //alert('disconnect');
        //peer.disconnect();

        document.getElementById('callPeer').disabled = false;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('shareScreenBtn').disabled = true;
        document.getElementById('sendPeerCode').disabled = false;
    });


    socket.emit('sendCode',{p:kod});
    document.getElementById('sendPeerCode').disabled = true;
});

peer.on('close', ()=>{
    alert('close');
});

peer.on('disconnected',()=>{
    alert('reconnect');
});


peer.on('open', function(){
    //alert(id);
    //$('#showPeer').html();
    console.log('peer connect');
});

peer.on('call', function(call){
    call.answer(myStream);
    call.on('stream', function(remoteStream){
        addRemoteVideo(remoteStream);
    });
});

function callPeer(id){
    navigator.mediaDevices.getDisplayMedia({
        video:{
            cursor: "always"
        }
    }).then((stream)=>{
        myStream = stream;
        let call = peer.call(id, stream);
        call.on('stream', function(remoteStream){
            if(!peerList.includes(call.peer)){
                //addRemoteVideo(remoteStream);
                currentPeer = call.peerConnection;
                peerList.push(call.peer);
            }
        })
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            reconnectStream();
        });
    }).catch((err)=>{
        console.log(err+" nie ma streamu");
    });
}

$('#callPeer').click(()=>{
    isJoiner = true;
    var kod = document.getElementById('peerID').value;
    code = kod;
    socket.emit('checkCode', {c: kod});
});

socket.on('codeResult', result => {
    if(isJoiner){
        var codeResult = result.r;
        if(codeResult){
            alert('Połączono się');
            let remotePeerId = document.getElementById('peerID').value;
            $('#showPeer').html('connecting '+remotePeerId);
            code = remotePeerId;
            document.getElementById('shareScreenBtn').disabled = false;
            document.getElementById('shareScreenBtn').addEventListener('click',()=>{
                callPeer(remotePeerId);
            });
            
            var w = document.getElementById('widthScreen').innerHTML;
            var h = document.getElementById('heigthScreen').innerHTML;
            socket.emit('sendScreenSize', {wi:w,he:h});
            document.getElementById('disconnectBtn').disabled = false;
            document.getElementById('callPeer').disabled = true;

            document.getElementById('disconnectBtn').disabled = false;
            document.getElementById('disconnectBtn').addEventListener('click', () => {
                //peer.disconnect();
                document.getElementById('callPeer').disabled = false;
                document.getElementById('disconnectBtn').disabled = true;
                document.getElementById('shareScreenBtn').disabled = true;
            });

            socket.emit('getCodeToCreatred',{c:peer.id});
        }
        else{
            alert('Nie można się połączyć z kodem: '+document.getElementById('generatedCode').innerHTML);
        }
    }
});

socket.on('sendCodeToCreatred', kod=>{
    secondCode = kod.c;
});

function addRemoteVideo(stream){
    var isMouseDown = false;

    let video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    video.setAttribute('id','videoTest')
    document.getElementById('remoteScreen').append(video);

    document.getElementById('fullScreen').addEventListener('click',()=>{
        pelnyEkran();
    });

    $('#videoTest').mouseenter(() => {isOnRemoteDiv = true});
    $('#videoTest').mouseleave(() => {isOnRemoteDiv = false});

    function pelnyEkran(){
        if(getFullscreenElement()){
            document.exitFullscreen();
            isfullScreen = false;
        }
        else{
            document.getElementById('videoTest').requestFullscreen().catch(console.log);
            isfullScreen = true;
        }
    }

    function getFullscreenElement(){
        if(document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullscreenElement
            || document.msFullscreenElement){
                return true;
            }
        else{
            return false;
        }
    }

    // przytrzymanie myszki
    $('#videoTest').mousedown(() => {
        isMouseDown = true;
        socket.emit('mouseDown', {m: true});
    });
    
    // zwolnienie przycisku myszki
    $('#videoTest').mouseup(() => {
        isMouseDown = false;
        socket.emit('mouseUp', {m: false});
    });

    // scrool 
    video.addEventListener('wheel', function(e){
        if(/*isOnRemoteDiv && */role=='client'){
            e.preventDefault();
            socket.emit('scroll', {x: e.deltaX, y: e.deltaY});
        }
    });

    video.addEventListener('mousemove',function(e){

        if(isfullScreen){
            var width = $('#videoTest').width();
            var height = $('#videoTest').height();
            $('#controlScreenSize').html(width + " "+height);
            
            var posX = $('#videoTest').offset().left;
            var posY = $('#videoTest').offset().top;
            
            var x = e.pageX - posX;
            var y = e.pageY - posY;
            
            var str = x+" "+y;
            if(screen.disabled){
                socket.emit('sendCoords',{x:x, y:y});
            }
            if(role=='client'){
                socket.emit('sendCoordFromMouseMove',{x:x, y:y, w:width, h:height});
            }
        }
        else{
            var width = $('#videoTest').width();
            var height = $('#videoTest').height();
            
            $('#controlScreenSize').html(width + " "+height);
            
            var posX = $('#videoTest').offset().left;
            var posY = $('#videoTest').offset().top;
            
            var x = e.pageX - posX;
            var y = e.pageY - posY;
            
            var str = x+" "+y;
            if(screen.disabled){
                socket.emit('sendCoords',{x:x, y:y});
            }
            if(role=='client'){
                socket.emit('sendCoordFromMouseMove',{x:x, y:y, w:width, h:height});
            }
        }
        
    });

    $(window).bind('keydown', (e)=>{
        e.preventDefault();
        if(isOnRemoteDiv && role=='client'){
            socket.emit('sendPressKey',{k:e.key});
        }
    });
    
    $(window).bind('keyup', (e)=>{
        if(isOnRemoteDiv && role=='client'){
            socket.emit('sendUpKey',{k:e.key});
        }
    });

}

function reconnectStream(){
    console.log('The user has ended sharing the screen');
    var v = document.getElementById('videoTest');
    document.getElementById('disconnectBtn').disabled = true;
    //document.getElementById('remoteScreen').removeChild(v);
    socket.emit('sendEndStream');
}

document.getElementById('disconnectBtn').addEventListener('click',()=>{
    socket.emit('removeCode', {c: code});
});

socket.on('refresh', ()=>{
    window.location.reload(true);
});

// GENEROWANIE KODU
function generateCode(){
    var code = '';
    for(let i=0; i<10; i++){
        code += Math.floor(Math.random()*10);
    }
    return code;
}

//ZAMYKANIE STRONY
/*window.addEventListener('beforeunload',(e)=>{
    e.preventDefault();
    var code = document.getElementById('generatedCode').innerHTML;
    socket.emit('removeCode',{c: code});
});*/

