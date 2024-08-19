import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Redis from "ioredis";
import helmet from "helmet";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const redis = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const tweetSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Tweet = mongoose.model("Tweet", tweetSchema);

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    try {
        const user = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return res.sendStatus(403);
    }
};

app.post("/api/signup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
        });
        await user.save();
        res.status(201).send("User created");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(400).send("Cannot find user");
        }
        if (await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.json({ token });
        } else {
            res.status(401).send("Not Allowed");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/tweets", authenticateToken, async (req, res) => {
    try {
        const tweet = new Tweet({
            content: req.body.content,
            author: req.user.id,
        });
        await tweet.save();
        res.status(201).send(tweet);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "NEW_TWEET", tweet }));
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get("/api/tweets", authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const cacheKey = `tweets:${page}`;
        const cachedTweets = await redis.get(cacheKey);

        if (cachedTweets) {
            return res.json(JSON.parse(cachedTweets));
        }

        const tweets = await Tweet.find().populate("author", "username").sort("-createdAt").skip(skip).limit(limit);

        await redis.set(cacheKey, JSON.stringify(tweets), "EX", 60);

        res.json(tweets);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.put("/api/tweets/:id", authenticateToken, async (req, res) => {
    try {
        const tweet = await Tweet.findOne({ _id: req.params.id, author: req.user.id });
        if (!tweet) return res.status(404).send("Tweet not found");
        tweet.content = req.body.content;
        await tweet.save();
        res.send(tweet);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.delete("/api/tweets/:id", authenticateToken, async (req, res) => {
    try {
        const result = await Tweet.deleteOne({ _id: req.params.id, author: req.user.id });
        if (result.deletedCount === 0) return res.status(404).send("Tweet not found");
        res.send("Tweet deleted");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/tweets/:id/like", authenticateToken, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet) return res.status(404).send("Tweet not found");
        if (tweet.likes.includes(req.user.id)) {
            tweet.likes.pull(req.user.id);
        } else {
            tweet.likes.push(req.user.id);
        }
        await tweet.save();
        res.send(tweet);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/tweets/:id/retweet", authenticateToken, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet) return res.status(404).send("Tweet not found");
        if (tweet.retweets.includes(req.user.id)) {
            tweet.retweets.pull(req.user.id);
        } else {
            tweet.retweets.push(req.user.id);
        }
        await tweet.save();
        res.send(tweet);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/users/:id/follow", authenticateToken, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);
        if (!userToFollow || !currentUser) return res.status(404).send("User not found");
        if (currentUser.following.includes(userToFollow._id)) {
            currentUser.following.pull(userToFollow._id);
            userToFollow.followers.pull(currentUser._id);
        } else {
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);
        }
        await currentUser.save();
        await userToFollow.save();
        res.send("Follow status updated");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "react/build")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "react/build", "index.html"));
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));