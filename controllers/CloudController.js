import asyncHandler from "express-async-handler";
// import cloudinary from "../config/cloud.js";
import MangaModel from "../models/MangaModel.js";
import { uploadImageToCloud } from "../utils/helper.js";
import UserModel from "../models/UserModel.js";
import sizeOf from "image-size";

// import { v4 as uuidv4 } from "uuid";
// import path from "path";

// ******** PRIVATE CONTROLLERS ***********
// @desc upload file
// @route POST /api/cloud
// @access Private
const uploadFile = asyncHandler(async (req, res) => {
  const file = req.file;
  // const { mangaId, chapId } = req.body;
  // try {
  //   const manga = await MangaModel.findById(mangaId);
  //   if (file) {
  //     const fileName =
  //       chapId == null || chapId == ""
  //         ? manga.nameOnUrl + "-avata"
  //         : file.originalname;
  //     const publicId =
  //       chapId == null || chapId == ""
  //         ? mangaId + "/" + fileName
  //         : mangaId + "/" + chapId + "/" + fileName;
  //     const { url, public_id } = await uploadImageToCloud(
  //       res,
  //       file.path,
  //       publicId
  //     );
  //     // const result = await cloudinary.uploader.upload(file.path, options);
  //     // console.log(result);
  //     res.json({ url, public_id });
  //     // return result.public_id;
  //   }
  // } catch (error) {
  //   res.status(400).json({ message: error.message });
  // }
  const { mangaName, chapName } = req.body;
  try {
    if (file) {
      const manganame = mangaName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
      const dimensions = sizeOf(file.path);
      const dotIndex = file.originalname.indexOf(".");
      const originalname =
        dotIndex !== -1
          ? file.originalname.substring(0, dotIndex)
          : file.originalname;
      // console.log("Width:", dimensions.width);
      // console.log("Height:", dimensions.height);
      const chapname =
        chapName !== undefined && chapName?.toLowerCase().replace(/\s+/g, "-");
      const fileName =
        chapName == null || chapName == "" || chapName == undefined
          ? manganame + "-avata"
          : originalname;
      const publicId =
        chapName == null || chapName == "" || chapName == undefined
          ? manganame + "/" + fileName
          : manganame + "/" + chapname + "/" + fileName;
      const { url, public_id } = await uploadImageToCloud(
        res,
        file.path,
        publicId,
        dimensions.width,
        dimensions.height
      );
      // const result = await cloudinary.uploader.upload(file.path, options);
      // console.log(result);
      res.json({ url, public_id, height: dimensions.height });
      // return result.public_id;
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc upload file
// @route POST /api/cloud
// @access Private
const uploadProfile = asyncHandler(async (req, res) => {
  const file = req.file;
  try {
    const user = await UserModel.findById(req.body.userId);
    if (user) {
      if (file) {
        const fileName = user._id;
        const publicId = "profile/" + fileName;
        const { url, public_id } = await uploadImageToCloud(
          res,
          file.path,
          publicId
        );
        // const result = await cloudinary.uploader.upload(file.path, options);
        // console.log(result);
        res.json({ url, public_id });
        // return result.public_id;
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export { uploadFile, uploadProfile };
