var peerCon = null;
var currentPeerCon = null
var myStream;
var roomID;

var createRoomBtn = document.getElementById('createRoomBtn');

createRoomBtn.addEventListener('click', createRoom);

function createRoom(){
    roomID = generateCode();
    peerCon = new Peer(roomID);
    
    $('#sendPeerCode').click(()=>{
        var kod = document.getElementById('showPeer').innerHTML;
        socket.emit('sendCode',{p:kod});
    });

    socket.on('setPeerCode', function(c){
        document.getElementById('r').innerHTML = c.pCode;
    });

    peerCon.on('open', id=>{
        $('#showPeer').html(id);
    });
    
    peerCon.on('call', call=>{
        call.answer(myStream);
            call.on('stream', function(remoteStream){
            addRemoteVideo(remoteStream);
        });
    });
    //alert(peerCon.id);
    
    $('#callPeer').click((e)=>{
        let remotePeerId = document.getElementById('peerID').value;
        $('#showPeer').html('connecting '+remotePeerId);
        callPeer(remotePeerId);
        var w = document.getElementById('widthScreen').innerHTML;
        var h = document.getElementById('heigthScreen').innerHTML;
        socket.emit('sendScreenSize', {wi:w,he:h});
        document.getElementById('reconnectBtn').disabled = false;
    });

}

function joinRoom(){
    roomID = document.getElementById('peerID');
    peerCon= new Peer();

    peerCon.peerCon('open', id=>{

    });
}


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