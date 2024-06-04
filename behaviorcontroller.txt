import WebSocket, { WebSocketServer } from "ws"; // Ensure this is correct
import cron from "node-cron";
import { protect } from "./middlewares/Auth.js";

const userCronJobs = new Map();

const startCronJob = (userId, behaviorItem) => {
  if (!userCronJobs.has(userId)) {
    const cronJob = cron.schedule("* * * * * *", async () => {
      //   behaviorItem.sumTimeRead += 1;
      //   await behaviorItem.save();
      console.log("Cron job running for user:", userId);
    });
    userCronJobs.set(userId, cronJob);
  }
};

const stopCronJob = (userId) => {
  const cronJob = userCronJobs.get(userId);
  if (cronJob) {
    cronJob.stop();
    userCronJobs.delete(userId);
  }
};

export const setupWebSocketServer = (server) => {
  //   const wss = new WebSocketServer({ noServer: true });
  const wss = new WebSocketServer({ server });
  wss.on("connection", async (ws, req) => {
    ws.on("message", (message) => {
      // const message = JSON.parse(message.data);
      // console.log(message);
    });
    // const token = req.url.split("?")[1]?.split("=")[1];
    // if (token) {
    //   try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     const user = await UserModel.findById(decoded.id).select("-password");
    //     if (user) {
    //       // Lưu thông tin người dùng vào đối tượng kết nối WebSocket
    //       ws.user = user;
    //       ws.on("message", (message) => {
    //         const { action, manganame, chapid } = JSON.parse(message);
    //         if (action === "start") {
    //           //   addBehavior(request.user, manganame, chapid).then(
    //           //     ([behavior, mangaId]) => {
    //           //       const behaviorItem = behavior.behaviorList.find(
    //           //         (b) => b.mangaId.toString() === mangaId.toString()
    //           //       );
    //           //       startCronJob(userId, behaviorItem);
    //           //     }
    //           //   );
    //         } else if (action === "stop") {
    //           stopCronJob(ws.user._id);
    //         }
    //       });
    //       //   ws.on("close", () => {
    //       //     stopCronJob(userId);
    //       //   });
    //     } else {
    //       console.log("Invalid user");
    //       ws.close();
    //     }
    //   } catch (error) {
    //     console.error("JWT verification failed:", error.message);
    //     ws.close();
    //   }
    // } else {
    //   console.log("No JWT token provided");
    //   ws.close();
    // }
    // protect(req, res, async () => {});
    // const userId = request.user._id.toString();
  });

  wss.on("upgrade", (request, socket, head) => {
    protect(request, {}, () => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  });
};
