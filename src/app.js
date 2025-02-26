import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// the cokie parser is used to perfom cred operations on user browser
// the server can read the cookies and also set the cookies

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

// the data can be sent in JSON format or in urlencoded format and for that we need to use settings
// we needed to use bodyparser to parse the data in the body of the request but now it is inbuilt in express
app.use(express.json({limit:"16kb"}));   // the limit is used to limit the size of the data that can be sent in the body of the request
app.use(express.urlencoded({extended: true, limit: "16kb"})); // to parse the data in urlencoded format
app.use(express.static("public")); // to serve static files. static files are the files that are not changed by the server. like images, css, js files
app.use(cookieParser()); // to parse the cookies


//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)


//https://localhost:8000/api/v1/users/register
export { app };
