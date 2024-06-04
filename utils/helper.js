import crypto from "crypto";
import cloudinary from "../config/cloud.js";

const sendError = (res, error, statusCode = 401) => {
  res.status(statusCode).json({ error });
};

const generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const buffString = buff.toString("hex");

      // console.log(buffString);
      resolve(buffString);
    });
  });
};

const uploadImageToCloud = async (res, file, publicId, width, height) => {
  const options = {
    // gravity: "face",
    height: height !== undefined ? height : 500,
    width: width !== undefined ? width : 500,
    crop: "thumb",
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    public_id: publicId,
  };
  const exist = await cloudinary.search
    .expression(`public_id:${publicId}`)
    .execute();
  if (exist.total_count != 0) {
    if (publicId && file) {
      const { result } = await cloudinary.uploader.destroy(publicId);
      if (result !== "ok") {
        return sendError(res, "Could not remove image from cloud!");
      }
    }
  }
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file,
    options
  );

  return {
    url,
    public_id,
  };
};

const hadleNotFound = (req, res) => {
  this.sendError(res, "Not Fonud", 404);
};

export { sendError, generateRandomByte, hadleNotFound, uploadImageToCloud };
