import BehaviorModel from "../models/BehaviorModel";

async function watchBehaviorCollection() {
  const changeStream = BehaviorModel.watch();

  changeStream.on("change", (change) => {
    console.log("Change occurred:", change);

    console.log("111");
  });

  changeStream.on("error", (error) => {
    console.error("Change stream error:", error);
  });
}

watchBehaviorCollection();
