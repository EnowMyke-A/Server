const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const cors = require("cors");
const cookie = require("cookie");
const nodemailer = require("nodemailer");
require("dotenv").config();
const app = express();

//const allowedOrigins=['http://127.0.0.1:3000/', 'http://127.0.0.1:5500/']

app.use(express.json()); // for parsing application/json
app.use(
	cors({
		origin: "http://127.0.0.1:5500",
		credentials: true,
		exposedHeaders: ["Set-Cookie", "Date", "ETag"],
	})
);

if (process.env.SECRET_KEY == undefined)
	fs.writeFileSync(
		".env",
		`SECRET_KEY=${crypto.randomBytes(20).toString("hex")}\n`
	);

const hostname = "localhost";

const server = http.createServer(app);
const io = socketIo(server);
const connectionString =
	"mongodb+srv://webdev944:WDXq4gUYnq8YA9JB@yotaperformancedb.wotkssf.mongodb.net/?retryWrites=true&w=majority";

mongoose
	.connect(connectionString, {
		dbName: "yotaperformancedb",
	})
	.then(() => console.log("Database connected successfully"))
	.catch((err) => console.log(err));

const Schema = mongoose.Schema;

// Define a simple schema for our database
const userReviews = new Schema({
	user_id: { type: String, required: true },
	user_name: { type: String, required: true },
	user_rating: { type: Number, required: true },
	user_text: { type: String, required: true },
});

const products = new Schema({
	_id: { type: String },
	product_name: { type: String, required: true },
	car_brand: { type: String, required: true },
	car_model: { type: String, required: true },
	make_material: { type: String, required: true },
	category: { type: String, required: true },
	category_brand: { type: String, required: true },
	wheel_size: { type: String, required: true, default: "Not Wheel" },
	fit_position: { type: String, required: true },
	description: { type: String, required: true },
	fitment: [{ type: String, required: true }],
	price: { type: Number, required: true },
	quantity_left: { type: Number, required: true },
	rating: { type: Number, required: true },
	reviews: [userReviews],
	images: [{ type: String, required: true }],
});

const shippingAddress = new Schema({
	street: { type: String, default: null },
	city: { type: String, default: null },
	state: { type: String, default: null },
	zip: { type: String, default: null },
	country: { type: String, default: null },
	telephone: { type: String, default: null },
});

const users = new Schema({
	_id: { type: String },
	username: { type: String, required: true },
	password: { type: String, required: true },
	email: { type: String, required: true },
	shipping_address: shippingAddress,
});

const orders = new Schema({
	_id: { type: String },
	user_id: { type: String, default: null },
	product_ids: { type: [String], required: true },
	quantities: { type: [Number], required: true },
	total_price: { type: Number, required: true },
	shipping_id: { type: Number, required: true },
	order_status: { type: String, default: "Not Delivered", required: true },
	order_date: { type: Date, required: true, default: Date.now() },
	delivery_date: { type: Date, required: true },
});

const shippings = new Schema({
	_id: { type: String },
	method: { type: String, required: true },
	cost: { type: Number, required: true },
	estimated_delivery_time: { type: String, required: true },
});

const transactionSchema = new Schema({
	amount: { type: Number, required: true },
	timestamp: { type: Date, default: Date.now },
});

const paymentSchema = new Schema({
	_id: { type: String },
	userId: { type: String, required: true },
	paymentMethod: { type: String, required: true },
	transactions: [transactionSchema],
});

const MessageSchema = new Schema({
	sender: { type: String, required: true },
	text: { type: String, required: true, default: "" },
	timestamp: { type: Date, required: true, default: Date.now() },
});

const ChatSchema = new Schema({
	_id: { type: String },
	adminId: { type: String, required: true },
	userId: { type: String, required: true },
	messages: [MessageSchema],
});

const BonusSchema = new Schema({
	_id: { type: String },
	bonus_name: { type: String, required: true },
	product_ids: [{ type: String, default: null }],
	value: { type: String, required: true },
	code: { type: String, default: null },
	endDate: { type: Date, default: null },
});

// Credit Card Model
const CreditCardSchema = new mongoose.Schema({
	cardNumber: { type: String, required: true },
	cardHolderName: { type: String, required: true },
	expiryDate: { type: String, required: true },
	cvv: { type: String, required: true },
});

const FinancialSchema = new Schema({
	_id: { type: String },
	CerditCardDetails: [CreditCardSchema],
});

// Create a model from the schema
const Chat = mongoose.model("Chat", ChatSchema);
const Payment = mongoose.model("Payment", paymentSchema);
const Shipping = mongoose.model("Shippings", shippings);
const Order = mongoose.model("Orders", orders);
const Product = mongoose.model("Products", products);
const User = mongoose.model("Users", users);
const Bonus = mongoose.model("Bonus", BonusSchema);
const Finance = mongoose.model("Finance", FinancialSchema);

function verifyToken(req, res, next) {
	const cookies = cookie.parse(req.headers.cookie || "");
	const token = cookies.token;

	jwt.verify(token, process.env.SECRET_KEY.toString(), (err, decoded) => {
		if (err) {
			res.send({ msg: "Access denied" });
		} else {
			req.decoded = decoded;
			next();
		}
	});
}

app.post("/create/product", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Products");
	const newTest = new Product(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/chat", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Chat");
	const newTest = new Chat(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/createUser", verifyToken, async (req, res) => {
	if (!req.body.email || !req.body.password) {
		return res.status(400).json({ message: "Missing email or password" });
	}

	if (!validator.isEmail(req.body.email)) {
		return res.status(400).json({ message: "Invalid email" });
	}

	const Credentials = Sanitizer(req.body.email, req.body.password);
	const name = nameSanitizer(req.body.username);
	req.body.password = hash(Credentials.sanitizedPassword);
	req.body.email = Credentials.sanitizedEmail;
	req.body.name = name;
	req.body._id = await generateUserId("Users");
	const newTest = new User(req.body);
	const result = await newTest.save();
	const payload = {
		identifier: req.body._id,
	};

	const expirationDateString = 30 * 24 * 60 * 60 * 1000;

	try {
		const token = jwt.sign(payload, process.env.SECRET_KEY.toString(), {
			expiresIn: 30 * 24 * 60 * 60 * 1000,
		});

		res.setHeader(
			"Set-Cookie",
			cookie.serialize("token", token, {
				maxAge: expirationDateString,
				sameSite: "none",
				secure: true,
				httpOnly: true,
				path: "/",
			})
		);
		res.send({ payload });
		sendWelcomeEmail(req.body.email, req.body.name);
	} catch (err) {
		console.error(err);
	}
});

app.post("/create/payment", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Payment");
	const newTest = new Payment(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/order", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Orders");
	req.body.delivery_date = calculateDeliveryDate();
	const newTest = new Order(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/shipping", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Shippings");
	const newTest = new Shipping(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/bonus", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Bonus");
	const newTest = new Bonus(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/finance", verifyToken, async (req, res) => {
	req.body._id = await generateUserId("Finance");
	const newTest = new Finance(req.body);
	const result = await newTest.save();
	res.send(result);
});

// Read a document from the database

app.get("/get/products", verifyToken, async (req, res) => {
	const result = await Product.find({});
	res.send(result);
});

app.get("/get/product/:id", verifyToken, async (req, res) => {
	const result = await Product.findOne({ _id: req.params.id });
	res.send(result);
});

app.get("/get/product/:carBrand", verifyToken, async (req, res) => {
	const result = await Product.find({ car_brand: req.params.carBrand });
	res.send(result);
});

app.get("/get/product/:carModel", verifyToken, async (req, res) => {
	const result = await Product.find({ car_model: req.params.carModel });
	res.send(result);
});

app.get("/get/product/:carBrand/:carModel", verifyToken, async (req, res) => {
	const result = await Product.find({
		car_brand: req.params.carBrand,
		car_model: req.params.carModel,
	});
	res.send(result);
});

app.get(
	"/get/product/:makeMaterial/:category",
	verifyToken,
	async (req, res) => {
		const result = await Product.find({
			make_material: req.params.makeMaterial,
			category: req.params.category,
		});
		res.send(result);
	}
);

app.get("/get/product/:category/:carModel", verifyToken, async (req, res) => {
	const result = await Product.find({
		category: req.params.category,
		car_model: req.params.carModel,
	});
	res.send(result);
});

app.get(
	"/get/product/:category/:categoryBrand",
	verifyToken,
	async (req, res) => {
		const result = await Product.find({
			category: req.params.category,
			category_brand: req.params.categoryBrand,
		});
		res.send(result);
	}
);

app.get(
	"/get/product/:carModel/:fitPosition",
	verifyToken,
	async (req, res) => {
		const result = await Product.find({
			car_model: req.params.carModel,
			fit_position: req.params.fitPosition,
		});
		res.send(result);
	}
);

app.get("/get/users", verifyToken, async (req, res) => {
	const result = await User.find({});
	res.send(result);
});

app.get("/get/user/:id", verifyToken, async (req, res) => {
	const result = await User.findOne({ _id: req.params.id });
	res.send(result);
});

app.get("/get/user", verifyToken, async (req, res) => {
	const result = await User.find({ email: req.query.email });
	res.send(result);
});

app.get("/get/chats", verifyToken, async (req, res) => {
	const result = await Chat.find({});
	res.send(result);
});

app.get("/get/chat/:id", verifyToken, async (req, res) => {
	const result = await Chat.find({ _id: req.params.id });
	res.send(result);
});

app.get("/get/order/:status", verifyToken, async (req, res) => {
	const result = await Order.find({ order_status: req.params.status });
	res.send(result);
});

app.get("/get/order", verifyToken, async (req, res) => {
	const result = await Order.find({});
	res.send(result);
});

app.get("/get/order/:user__id", verifyToken, async (req, res) => {
	const result = await Order.find({ user_id: req.params.user__id });
	res.send(result);
});

app.get("/get/payments", verifyToken, async (req, res) => {
	const result = await Payment.find({});
	res.send(result);
});

app.get("/get/shippings", verifyToken, async (req, res) => {
	const result = await Payment.find({});
	res.send(result);
});

app.get("/get/bonus", verifyToken, async (req, res) => {
	const result = await Bonus.find({});
	res.send(result);
});

app.get("/get/cards", verifyToken, async (req, res) => {
	const result = await Finance.find({});
	res.send(result);
});

app.post("/", async (req, res) => {
	const cookies = cookie.parse(req.headers.cookie || "");
	const token = cookies.token;
	const expirationDateString = 30 * 24 * 60 * 60 * 1000;
	try {
		if (!token) {
			const payload = { identifier: "guest" };
			const guestToken = jwt.sign(payload, process.env.SECRET_KEY.toString());
			res.setHeader(
				"Set-Cookie",
				cookie.serialize("token", guestToken, {
					maxAge: expirationDateString,
					sameSite: "none",
					secure: true,
					httpOnly: true,
				})
			);
			res.send({ payload });
		} else {
			try {
				jwt.verify(token, process.env.SECRET_KEY.toString());
				const payload = getPayload(token);
				res.send({ payload });
			} catch (err) {
				console.error(err);
				res.status(401).send("Invalid Token");
			}
		}
	} catch (err) {
		console.error(err);
		console.log("authentication working");
		res.status(500).send("Internal Server Error");
	}
});

//Routes to Update a document in the database
app.put("/update/messages/:id/add", verifyToken, async (req, res) => {
	const result = await Chat.findByIdAndUpdate(
		req.params.id,
		{
			$push: {
				messages: {
					$each: req.body,
				},
			},
		},
		{ new: true }
	);
	res.send(result);
});

app.put("/update/products/:id", verifyToken, async (req, res) => {
	const result = await Product.findByIdAndUpdate(req.params.id, req.body);
	res.send(result);
});

app.put("/update/user/shipping/:id", verifyToken, async (req, res) => {
	const result = await User.findByIdAndUpdate(
		req.params.id,
		{
			"shipping_address.street": req.body.street,
			"shipping_address.city": req.body.city,
			"shipping_address.state": req.body.state,
			"shipping_address.zip": req.body.zip,
			"shipping_address.telephone": req.body.telephone,
		},
		{ new: true }
	);

	res.send(result);
});
//end of updates

// Routes to Delete a document from the database
app.delete("/delete/bonus/:id", verifyToken, async (req, res) => {
	const result = await Bonus.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/payment/:id", verifyToken, async (req, res) => {
	const result = await Payment.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/product/:id", verifyToken, async (req, res) => {
	const result = await Product.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/chat/:id", verifyToken, async (req, res) => {
	const result = await Chat.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/order/:id", verifyToken, async (req, res) => {
	const result = await Order.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/shipping/:id", verifyToken, async (req, res) => {
	const result = await Chat.findByIdAndDelete(req.params.id);
	res.send(result);
});

//Delete route ends here

//Login Route
app.post("/login", verifyToken, async (req, res) => {
	const expirationDateString = 30 * 24 * 60 * 60 * 1000;
	const userData = Sanitizer(req.body.email, req.body.password);

	if (!userData.sanitizedEmail || !userData.sanitizedPassword) {
		return res.json({ message: "Missing email or password" });
	}

	const user = await User.findOne({ email: userData.sanitizedEmail });
	if (!user) {
		return res.json({ msg: "Email not found" });
	}

	const isMatch = bcrypt.compareSync(userData.sanitizedPassword, user.password);
	if (!isMatch) {
		return res.json({ msg: "Wrong Password" });
	}

	const payload = {
		identifier: user.id,
	};

	try {
		const token = jwt.sign(payload, process.env.SECRET_KEY.toString(), {
			expiresIn: 30 * 24 * 60 * 60 * 1000,
		});

		res.setHeader(
			"Set-Cookie",
			cookie.serialize("token", token, {
				maxAge: expirationDateString,
				sameSite: "none",
				secure: true,
				httpOnly: true,
			})
		);
		res.send({ payload });
	} catch (err) {
		console.error(err);
	}
});

app.post("/logout", verifyToken, async (req, res) => {
	const expirationDateString = 30 * 24 * 60 * 60 * 1000;
	const payload = {
		identifier: "guest",
	};

	try {
		const token = jwt.sign(payload, process.env.SECRET_KEY.toString(), {
			expiresIn: 30 * 24 * 60 * 60 * 1000,
		});

		res.setHeader(
			"Set-Cookie",
			cookie.serialize("token", token, {
				maxAge: expirationDateString,
				sameSite: "none",
				secure: true,
				httpOnly: true,
			})
		);
		res.send({ payload });
	} catch (err) {
		console.error(err);
	}
});

//End of Login route

//Sever-side hash
function hash(password) {
	try {
		const rounds = parseInt(process.env.ROUNDS, 10);
		const salt = bcrypt.genSaltSync(rounds);
		const hashedPassword = bcrypt.hashSync(password, salt);
		return hashedPassword;
	} catch (error) {
		console.log(error);
	}
}

//Calculates delivery Date
function calculateDeliveryDate() {
	const now = new Date();
	let businessDays = Math.floor(Math.random() * 3) + 3; // Random number between 3 and 5

	while (businessDays > 0) {
		now.setDate(now.getDate() + 1);
		if (now.getDay() !== 0 && now.getDay() !== 6) {
			// Skip weekends
			businessDays--;
		}
	}

	return now;
}

//Decode jwt payload
function getPayload(token) {
	const base64Url = token.split(".")[1];
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	const payload = JSON.parse(
		decodeURIComponent(
			atob(base64)
				.split("")
				.map(function (c) {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join("")
		)
	);

	return payload;
}

//AutoGenerateID for documents on database
async function generateUserId(collectionName) {
	const orderNumber = await countDocuments(collectionName);
	const date = new Date();
	const distance = date.getTime();

	let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	let seconds = Math.floor((distance % (1000 * 60)) / 1000);

	const dateStr = `${hours.toString().padStart(2, "0")}${seconds
		.toString()
		.padStart(2, "0")}${minutes.toString().padStart(2, "0")}${(
		date.getMonth() + 1
	)
		.toString()
		.padStart(2, "0")}${date.getFullYear()}${date
		.getDate()
		.toString()
		.padStart(2, "0")}`;
	const orderStr = orderNumber.toString().padStart(5, "0");
	const Id = `${dateStr}${orderStr}`;
	return Id;
}

async function countDocuments(collectionName) {
	const collection = mongoose.model(collectionName);
	const count = await collection.countDocuments({});
	return count;
}

//severSide_Sanitizer
function Sanitizer(email, password) {
	const sanitizedEmail = validator.normalizeEmail(email);
	const sanitizedPassword = validator.escape(password);
	return { sanitizedEmail, sanitizedPassword };
}

function nameSanitizer(name) {
	const sanitizedName = validator.escape(name);
	return sanitizedName;
}
//socket.io section

var UserSocketMap = new Map();

io.on("connection", (socket) => {
	const WelcomMsg =
		"Hey what can I help with today. Leave a message and I'll reply as soon as possible";

	console.log("a user connected");

	socket.emit("greeting", WelcomMsg); // Send greeting to client

	socket.on("disconnect", () => {
		socket.on("disconnecting", (identifier) => {
			UserSocketMap.set(identifier, null);
			console.log("user disconnected");
		});
	});

	socket.on("admin_reply", async (msg) => {
		const SendPort = UserSocketMap.get(msg.reciever);
		io.to(SendPort).emit("chat message", msg);
		const historyConversation = await CheckChats(msg.reciever);
		const chatID = historyConversation._id;
		socket.emit("store_chat", { msg, chatID });
	});

	socket.on("chat message", async (msg) => {
		const SendPort = UserSocketMap.get(msg.reciever);
		io.to(SendPort).emit("chat message", msg);
		const historyConversation = await CheckChats(msg.sender);
		if (historyConversation) {
			const chatID = historyConversation._id;
			socket.emit("update_chats", { msg, chatID });
		} else {
			socket.emit("start_chats", msg);
		}
	});

	socket.on("register", (userID) => {
		UserSocketMap.set(userID, socket.id);
		console.log("User registered: " + userID);
	});
});

var port = process.env.PORT || 3000;
app.listen(port, hostname, function () {
	console.log("App is listening on " + hostname + ":" + port);
});

//Side functions needed by socket

async function CheckChats(user) {
	try {
		const result = await Chat.findOne({ user_id: user });
		console.log(result);
		return result;
	} catch (err) {
		console.log(err);
	}
}

//added portion

app.put("/update/product/addReview/:id", async (req, res) => {
	const result = await Product.findByIdAndUpdate(
		req.params.id,
		{ $push: { reviews: req.body } },
		{ new: true }
	);
	res.send(result);
});

app.get("/get/orders", async (req, res) => {
	try {
		const result = await Order.find({});
		const newResult = result.map((item) => ({ ...item, id: item._id }));
		res.send(newResult);
	} catch (error) {
		res.status(500).send("Error retrieving orders");
	}
});

app.get("/get/chat/admin/:id", async (req, res) => {
	const result = await Chat.find({ adminId: req.params.id });

	const newResult = await Promise.all(
		result.map(async (chat) => {
			const user = await User.findOne(
				{ _id: chat.userId },
				{ username: true, _id: false }
			);
			return { ...chat._doc, username: user.username };
		})
	);

	res.send(newResult);
});

//send-email
app.post("/send-email", async (req, res) => {
	try {
		const { name, email, subject, message } = req.body;

		// Sanitize inputs (use express-validator if needed)

		// Create a transporter (SMTP settings)
		const transporter = nodemailer.createTransport({
			host: process.env.SERVICE,
			secure: true,
			auth: {
				user: process.env.HOST,
				pass: process.env.HOSTPASS,
			},
		});

		await transporter.sendMail({
			from: `${name} <infos@yotaperformanceshop.com>`,
			to: "infos@yotaperformanceshop.com",
			subject: subject,
			text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
		});

		res.status(200).json({ message: "Email sent successfully!" });
	} catch (error) {
		console.error("Error sending email:", error);
		res.status(500).json({ error: "Failed to send email" });
	}
});

async function sendWelcomeEmail(email, name) {
	const transporter = nodemailer.createTransport({
		host: process.env.SERVICE,
		secure: true,
		auth: {
			user: process.env.HOST,
			pass: process.env.HOSTPASS,
		},
	});

	await transporter.sendMail({
		from: "Yota Performance Shop <infos@yotaperformanceshop.com>",
		to: email,
		subject: "Welcome to Yota Performance Shop!",
		html: `
		<!DOCTYPE html>
<html>
	<head>
		<title>Welcome Email</title>
		<style>
			body {
				padding: 20px;
                margin: auto;
			}

			ul,
			li {
				list-style: none;
				width: max-content;
				padding: 0px;
				margin-top: 40px;
				margin-bottom: 50px;
			}

			.address {
				font-size: 14px;
				margin: auto;
				text-align: right;
			}

			a {
				text-decoration: none;
				color: white;
				background: linear-gradient(45deg, #ff0000af, #ff003c);
				border-radius: 4px;
				padding: 10px 15px;
			}

			p {
				font-size: 16px;
			}

            .YPS-footer-logo{
                width: 100%;
                margin: 40px 0px 10px;
                border-radius: 6px;
            }

            a.socials img{
                width: 25px;
                height: 25px;
            }

            a.socials{
                display: flex;
                align-items: center;
                padding: 4px;
            }

            span.social-section{
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }
		</style>
	</head>
	<body>
		<h1>Welcome to Yota Performance Shop!</h1>
		<p style="font-weight: 600;">Dear ${name},</p>
		<p>We're excited to have you on board. Thank you for signing up!</p>
		<p>You can continue back to our website using the link below :</p>
		<ul>
			<li>
				<a href="">Start Shopping now</a>
			</li>
		</ul>
		<p>
			If you have any questions, feel free to reply to this email. We're here to
			help!
		</p>
		<p>Best,</p>
		<p>${name}</p>
        <span class="social-section">
            Follow us on Instagram:
            <a href="https://www.instagram.com/matt_toyota_autospare?igsh=eHg3dTh3N2R2MTR2" class="socials">
			<img src="./email_Resource/instagram.svg" alt="instagram_logo">
			</a>
        </span>
        <img src="./email_Resource/haArtboard_1.png" alt="YPS-footer" class="YPS-footer-logo">
		<p class="address">
			&copy;2024 Yota Performance Shop <br />
			2400 W Seventh Ave <br />
			Dever, CO 80204 United States
		</p>
	</body>
</html>

		`,
	});
}
