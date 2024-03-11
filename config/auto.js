import cron from "node-cron";
import MangaModel from "../models/MangaModel.js";

export const autoMonth = cron.schedule("0 0 1 * *", async () => {
  try {
    const mangaList = await MangaModel.find({});
    for (const manga of mangaList) {
      const totalViewInMonthNew = manga.totalViewInMonthNew;
      manga.totalViewInMonthOld = totalViewInMonthNew;
      await manga.save();
    }
    await MangaModel.updateMany(
      {},
      {
        $set: {
          totalViewInMonthNew: 0,
        },
      }
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const autoWeek = cron.schedule("0 0 * * 1", async () => {});

export const autoDay = cron.schedule("0 1 * * *", async () => {});
