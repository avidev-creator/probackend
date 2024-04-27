import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import express from "express";

dotenv.config({
  path: "/.env",
});

const app = express();

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server Listening on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Connection Failed To Mongo DB", err);
  });

/* Express Imports */
{
  /*
import express from "express";

const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error: ", error);
    });

    app.listen(process.env.PORT, () => {
      console.log(`App Is Listening On : ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
*/
}
