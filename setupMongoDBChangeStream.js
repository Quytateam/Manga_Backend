import mongoose from "mongoose";

export const setupMongoDBChangeStream = (io) => {
  mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB");
    const notificationStream = mongoose.connection
      .collection("NotificationModel")
      .watch();
    // console.log(notificationStream);
    // notificationStream.on("change");
  });
};
