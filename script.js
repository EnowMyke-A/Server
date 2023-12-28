async function CreateUserAccount(){
	const name = document.querySelector("#Name").value;
	var Email = document.querySelector("#email").value;
	var Password = document.querySelector("#password").value;

	var emailFound;

	const EmailCheckerUrl = `http://localhost:3000/get/user?email=${Email}`;

	fetch(EmailCheckerUrl)
  .then(res => res.json())
  .then(data => {
    emailFound = data.length;

	if (!emailFound){
		Password = hashPassword(Password);
	
		const url = "http://localhost:3000/create/user";
	
		const Userdata = {
			_id: "",
			username: name,
			email: Email,
			password: Password,
		};
	
		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(Userdata),
		};
	
		fetch(url, options)
			.then((res) => res.json())
			.then((res) => console.log(res))
			.catch((err) => console.error("Error:", err));
	}
	
	else{
		console.log("An account already has this email");
	}	
  })
  .catch(err => console.error("Error:", err));

}

function hashPassword(password) {
	var stringToHash = password;
	var hashedString = sha256(stringToHash);
	return hashedString;
}

async function UpdateShippingInfo(UserID) {
	const url = `http://localhost:3000/update/user/shipping/${UserID}`;

	const Street = document.querySelector("#street").value;
	const City = document.querySelector("#city").value;
	const State = document.querySelector("#state").value;
	const ZIP = document.querySelector("#zip").value;
	const Telephone = document.querySelector("#telephone").value;
	const Country = document.querySelector("#country").value;

	const Userdata = {
		street: Street,
		city: City,
		state: State,
		zip: ZIP,
		country: Country,
		telephone: Telephone,
	};

	const options = {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(Userdata),
	};

	fetch(url, options)
		.then((res) => res.json())
		.then((res) => console.log(res))
		.catch((err) => console.error("Error:", err));
}


