const socket = io();

    socket.on('greeting', function(msg){
        $('#messages').append($('<li>').text(msg));
    });

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
    });

    socket.on('connection',()=>{
        socket.emit('registered', indentity);
    })

    socket.on('disconnect', ()=>{
        socket.emit('disconnecting', identity);
    });