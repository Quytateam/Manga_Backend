import crypto from "crypto-js";

const sendError = (res, error, statusCode = 401) => {
  res.status(statusCode).json({ error });
};

const generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const buffString = buff.toString("hex");

      console.log(buffString);
      resolve(buffString);
    });
  });
};

const hadleNotFound = (req, res) => {
  this.sendError(res, "Not Fonud", 404);
};

export { sendError, generateRandomByte, hadleNotFound };
