const socket = io.connect('http://localhost:3000');

socket.on('connection',()=>{

    //Fetch all chats on connection
    const MessageURl='http://localhost:3000//get/chats'

    fetch(MessageURl)
    .then((res)=> res.json())
    .then((data)=>{
        console.log(data)
    })
    .catch((err)=>{
        console.log(err)
    })
    //end of chat fetch

    socket.emit('register', identity);


    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        const message={
            sender: identity,
            reciever: reciever_id,
            messageBody: $('#m').val()
        }
        socket.emit('admin_reply', message);
        $('#m').val('');
        return false;
    });


    socket.on('store_chat',(Chat)=>{
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

});