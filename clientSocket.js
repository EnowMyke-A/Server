const socket = io.connect('http://localhost:3000');

socket.on('connection',()=>{
    socket.emit('register', identity);

    socket.on('greeting', function(msg){
        $('#messages').append($('<li>').text(msg));
    });

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        const message={
            sender: identity,
            reciever: reciever_id,
            messageBody: $('#m').val()
        }
        socket.emit('chat message', message);
        $('#m').val('');
        return false;
    });
    socket.on('chat message',(msg)=>{
        $('#messages').append($('<li>').text(msg));
    });

    socket.on('start_chats',(message)=>{
        const url = 'http://localhost:3000/create/chat';
        const chatData = {
			_id: "",
			adminID: message.reciever,
			userId: message.sender,
			message: [
                {
                    sender: message.sender,
                    text: message.messageBody
                }
            ],
		};
	
		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(chatData),
		};
        fetch(url, options)
			.then((res) => res.json())
			.then((res) => console.log(res))
			.catch((err) => console.error("Error:", err));
    });

    socket.on('update_chats',(Chat)=>{
        const url = `http://localhost:3000/update/messages/${Chat.chatID}/add`;
        const chatData = {
			message: [
                {
                    sender: Chat.msg.sender,
                    text: Chat.msg.messageBody
                }
            ],
		};
	
		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(chatData),
		};
        fetch(url, options)
			.then((res) => res.json())
			.then((res) => console.log(res))
			.catch((err) => console.error("Error:", err));
    });

    

    socket.on('disconnect', ()=>{
        socket.emit('disconnecting', identity);
    });
});