import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/Auth.js";
import { generateMailTransporter, generateOTP } from "../utils/mail.js";
import EmailVerificationToken from "../models/EmailVerificationToken.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { sendError, generateRandomByte } from "../utils/helper.js";
import MangaModel from "../models/MangaModel.js";
import mongoose from "mongoose";
import HistoryModel from "../models/HistoryModel.js";
import BehaviorModel from "../models/BehaviorModel.js";
import { addBehavior } from "./BehaviorController.js";
import WarningModel from "../models/WarningModel.js";
import CommentModel from "../models/CommentModel.js";
import NotificationModel from "../models/NotificationModel.js";
import { render, renderComment } from "../utils/render.js";
import { image } from "@tensorflow/tfjs";
import axios from "axios";
import passport from "../config/passport.js";

// @desc Register user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, image, role = "ROLE_USER" } = req.body;

  try {
    const userExists = await User.findOne({ email });
    // check if user exists
    if (userExists) return sendError(res, "Tài khoản đã tồn tại", 400);

    let admin = false;

    if (role == "ROLE_ADMIN") {
      admin = true;
    }

    // res.status(201).json({
    //   fullName,
    //   email,
    //   password,
    //   image,
    // });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      image,
      isAdmin: admin,
    });
    // if user created successfully send user data and token to client
    if (user) {
      // Bổ sung thêm
      //generate 6 digit OTP
      let OPT = generateOTP();

      // const newEmailVerificationToken = new EmailVerificationToken({
      //   owner: user._id,
      //   token: OPT,
      // });

      // await newEmailVerificationToken.save();
      await EmailVerificationToken.create({
        owner: user._id,
        token: OPT,
      });

      // //send opt to user
      var transport = generateMailTransporter();

      transport.sendMail({
        // from: "mailtrap@demomailtrap.com",
        // to: "6151071090@st.utc2.edu.vn",
        from: "6151071090@st.utc2.edu.vn",
        to: user.email,
        // to: user.email,
        subject: "Email Verification",
        html: `
                <p>Your verification OTP</p>
                <h1>${OPT}</h1>
            `,
      });

      res.status(201).json({
        _id: user._id,
        isVerified: user.isVerified,
        // fullName: user.fullName,
        // email: user.email,
        // image: user.image,
        // isAdmin: user.isAdmin,
        // role: user.role,
        // token: generateToken(user._id), // Test trc trên postman, đúng là phải đợi xác minh email đã mới được tạo token
      });
    } else {
      res.status(400);
      throw new Error("Dữ liệu người dùng không hợp lệ"); //Invalid user data
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Verify Email
// @route POST /api/users/verify-email
// @access Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { userId, OTP } = req.body;
  if (!mongoose.isValidObjectId(userId)) return sendError(res, "Invalid user!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found!", 404);
  if (user.isVerified) return sendError(res, "User is already varified!");
  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "Token not found!");
  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please sumbit a valid OTP!");
  user.isVerified = true;
  const docs = await MangaModel.find({}, "_id");
  user.recommendList = docs.map((doc) => doc._id.toString());
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  var transport = generateMailTransporter();
  transport.sendMail({
    // from: "mailtrap@demomailtrap.com",
    // to: "6151071090@st.utc2.edu.vn",
    from: "6151071090@st.utc2.edu.vn",
    to: user.email,
    // to: user.email,
    subject: "Welcome Email",
    html: `
            <h1> Welcome to our app and thanks for choosing us. </h1>
        `,
  });
  const historyExist = await HistoryModel.findOne({ userId: user._id });
  if (!historyExist)
    await HistoryModel.create({
      userId: user._id,
    });
  const behaviorExist = await BehaviorModel.findOne({ userId: user._id });
  if (!behaviorExist)
    await BehaviorModel.create({
      userId: user._id,
    });
  const warningExist = await WarningModel.findOne({ userId: user._id });
  if (!warningExist)
    await WarningModel.create({
      userId: user._id,
    });

  res.json({
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      image: user.image,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      token: generateToken(user._id),
      hasPassword: user.password !== "0 password" ? true : false,
    },
    message: "Your email is verified.",
  });
});

// @desc Resend Email Verification
// @route POST /api/users/resend-email-verification-token
// @access Public
const resendEmailVerificationToken = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found!");

  if (user.isVerified)
    return sendError(res, "This is email id is already verified!");

  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken) {
    sendError(
      res,
      "Only after one hour you can request for another token! Please waitting"
    );
  } else {
    // generate 6 digit otp
    let OTP = generateOTP();

    //store otp inside db
    const newemailVarificationToken = new EmailVerificationToken({
      owner: user._id,
      token: OTP,
    });
    await newemailVarificationToken.save();

    //send opt to user
    var transport = generateMailTransporter();

    transport.sendMail({
      // from: "mailtrap@demomailtrap.com",
      // to: "6151071090@st.utc2.edu.vn",
      from: "6151071090@st.utc2.edu.vn",
      to: user.email,
      // to: user.email,
      subject: "Welcome Email",
      html: `
            <p>Your verification OTP</p>
            <h1>${OTP}</h1>
        `,
    });
    res.json({
      message: "New OTP has been send to your registed email account",
    });
  }
});

// @desc Forget Password
// @route POST /api/users/forget-password
// @access Public
const forgetPassword = asyncHandler(async (req, res) => {
  let { email } = req.body;

  if (!email) sendError(res, "Please enter your email!");
  email = email.toLowerCase();
  const user = await User.findOne({ email });
  if (!user) sendError(res, "Can not found your account", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user.id });
  if (alreadyHasToken) {
    sendError(res, "After one hour you can request for another token!");
  } else {
    const token = await generateRandomByte();
    const newpasswordResetToken = await PasswordResetToken({
      owner: user._id,
      token,
    });
    await newpasswordResetToken.save();

    var resetPasswordUrl = `http://localhost:3000/auth/users/reset-password?token=${token}&id=${user._id}`;

    const transport = generateMailTransporter();

    transport.sendMail({
      // from: "mailtrap@demomailtrap.com",
      // to: "6151071090@st.utc2.edu.vn",
      from: "6151071090@st.utc2.edu.vn",
      to: user.email,
      // to: user.email,
      subject: "Reset Password Link",
      html: `
        <p>CLick here to reset password</p>
        <a href='${resetPasswordUrl}'>Change Password</a>
    `,
    });

    res.json({ message: "Link sent to your email!" });
  }
});

// @desc Verify Pass Reset Token
// @route POST /api/users/verify-pass-reset-token
// @access Public
const sendResetPasswordTokenStatus = asyncHandler(async (req, res) => {
  res.json({ valid: true });
});

// @desc Reset Password
// @route POST /api/users/reset-password
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const { id } = req.query;
  try {
    const user = await User.findById(id);
    const matched = await bcrypt.compare(newPassword, user.password);
    if (matched)
      return sendError(
        res,
        "The new password must be different from the old one!"
      );
    const matchedConfirm = newPassword === confirmPassword;
    if (!matchedConfirm)
      return sendError(
        res,
        "The confirm password is different from new password"
      );
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

    const transport = generateMailTransporter();

    transport.sendMail({
      // from: "mailtrap@demomailtrap.com",
      // to: "6151071090@st.utc2.edu.vn",
      from: "6151071090@st.utc2.edu.vn",
      to: user.email,
      // to: user.email,
      subject: "Password Reset Successfully",
      html: `
      <h1>Password Reset Successfully</h1>
      <p>Now you can use new password.</p>

    `,
    });

    res.json({
      message: "Password reset successfully, now you can use new password.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Login user
// @route POST /api/users/login
// @access public
const loginUser = asyncHandler(async (req, res) => {
  const { password } = req.body;
  let { email } = req.body;
  try {
    // Find account in db
    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (user.enable === 0) res.status(400).json({ message: error.message });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.isVerified) {
        res.json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
          token: generateToken(user._id),
          hasPassword: user.password !== "0 password" ? true : false,
        });
      } else {
        res.json({
          _id: user._id,
          isVerified: user.isVerified,
        });
      }
    } else {
      sendError(res, "Email or password is invalid");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Login google
// @route POST /api/google/callback
// @access public
const loginGoogle = (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      if (err) {
        // Xử lý lỗi nếu có
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        // Xác thực thất bại, chuyển hướng người dùng đến trang login và truyền thông báo lỗi
        return res.redirect("http://localhost:3000/login");
      }
      try {
        const email = user._json.email;
        const userExists = await User.findOne({ email });
        if (!userExists) {
          await User.create({
            fullName: user._json.name,
            email: email.toLowerCase(),
            password: "0 password",
            image: user._json.picture,
            isAdmin: false,
          });
        }
        return res.redirect(
          `http://localhost:3000/Login?success=${user._json.email}`
        );
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  )(req, res, next);
};

// @desc Login google success
// @route POST /api/google/success
// @access public
const loginGoogleSucces = asyncHandler(async (req, res) => {
  let { email } = req.body;
  try {
    // Find account in db
    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (user.enable === 0) res.status(400).json({ message: error.message });
    if (user.isVerified) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        token: generateToken(user._id),
        hasPassword: user.password !== "0 password" ? true : false,
      });
    } else {
      const alreadyHasToken = await EmailVerificationToken.findOne({
        owner: user._id,
      });
      if (!alreadyHasToken) {
        let OTP = generateOTP();

        const newemailVarificationToken = new EmailVerificationToken({
          owner: user._id,
          token: OTP,
        });
        await newemailVarificationToken.save();

        var transport = generateMailTransporter();

        transport.sendMail({
          from: "6151071090@st.utc2.edu.vn",
          to: user.email,
          subject: "Welcome Email",
          html: `
            <p>Your verification OTP</p>
            <h1>${OTP}</h1>
        `,
        });
      }

      res.json({
        _id: user._id,
        isVerified: user.isVerified,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Login user
// @route POST /api/users/userinfo
// @access public
const getUserInfo = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id, {
      _id: 1,
      fullName: 1,
      image: 1,
      createdAt: 1,
    });
    if (user) {
      const commentList = await CommentModel.aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "mangas",
            localField: "mangaId",
            foreignField: "_id",
            as: "manga",
          },
        },
        {
          $addFields: {
            mangaImage: { $arrayElemAt: ["$manga.image", 0] },
            mangaName: { $arrayElemAt: ["$manga.name", 0] },
            mangaNameOnUrl: { $arrayElemAt: ["$manga.nameOnUrl", 0] },
          },
        },
        {
          $project: {
            commentContent: 1,
            mangaId: 1,
            mangaImage: 1,
            mangaName: 1,
            mangaNameOnUrl: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 15 },
      ]);
      res.json({ user, commentList });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ******** PRIVATE CONTROLLERS ***********

// @desc Update user profile
// @route PUT /api/user/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, image } = req.body;
  try {
    // Tìm tk trong DB
    const user = await User.findById(req.user._id);
    // Nếu tài khoản tồn tại
    if (user) {
      user.fullName = fullName || user.fullName;
      // user.email = email || user.email; // Email không được đổi
      user.image = image || user.image;

      const updateUser = await user.save();

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        token: generateToken(user._id),
        hasPassword: user.password !== "0 password" ? true : false,
      });
      // else send error message
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete user profile
// @route Delete /api/user/profile
// @access Private
const deleteUserProfile = asyncHandler(async (req, res) => {
  try {
    // Find account
    const user = await User.findById(req.user._id);
    // If exists
    if (user) {
      // Nếu tài khoản là Admin
      if (user.isAdmin) {
        res.status(400);
        throw new Error("Tài khoản Admin không thể xóa");
      }
      // else => xóa
      await user.deleteOne();
      res.json({ message: "Tài khoản đã xóa" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Change user password
// @route PUT /api/user/password
// @access Private
const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    // Tìm tài khoản
    const user = await User.findById(req.user._id);
    // Nếu tồn tại
    if (user && (await bcrypt.compare(oldPassword, user.password))) {
      // hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      await user.save();
      res.json({ message: "Mật khẩu đã được thay đổi!" });
    } else {
      res.status(401);
      throw new Error("Mật khẩu cũ không đúng");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Create user password
// @route PUT /api/user/createpassword
// @access Private
const createUserPassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  try {
    // Tìm tài khoản
    const user = await User.findById(req.user._id);
    // Nếu tồn tại
    const matchedConfirm = newPassword === confirmPassword;
    if (!matchedConfirm)
      return sendError(
        res,
        "The confirm password is different from new password"
      );
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.json({
      message: "Create password successfully, now you can use this password.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all following manga
// @route GET /api/user/follow
// @access Private
const getFollowingManga = asyncHandler(async (req, res) => {
  const { page } = req.query;
  try {
    //Tìm tk
    const user = await User.findById(req.user._id).populate("followingManga");
    // Nếu tk tồn tại
    if (user) {
      // const manga = await await MangaModel.aggregate([
      //   { $match: { enable: 1 } },
      //   {
      //     $set: {
      //       chapter: {
      //         $slice: [
      //           {
      //             $filter: {
      //               input: {
      //                 $sortArray: {
      //                   input: "$chapter",
      //                   sortBy: { chapName: -1 },
      //                 },
      //               },
      //               as: "c",
      //               cond: { $eq: ["$$c.enable", 1] },
      //             },
      //           },
      //           3,
      //         ],
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       image: 1,
      //       numberOfChapters: 1,
      //       numberOfViews: 1,
      //       numberOfFollows: 1,
      //       numberOfComments: 1,
      //       "chapter.chapName": 1,
      //       "chapter.updatedAt": 1,
      //       totalViewInMonthOld: 1,
      //       status: 1,
      //       createdAt: 1,
      //       updatedAt: 1,
      //     },
      //   },
      //   { $sort: { updatedAt: -1 } },
      // ]);
      getMangaInfoForFollowingManga(res, user.followingManga, page);
      // res.json(user.followingManga);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all following manga
// @route GET /api/user/allfollow
// @access Private
const getAllFollowingManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.user._id).populate("followingManga");
    // Nếu tk tồn tại
    if (user) {
      const followingMangaIds = user.followingManga.map((manga) => manga._id);
      res.json(followingMangaIds);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Add manga to list follow
// @route POST /api/users/follow
// @access Private
const addFollowingManga = asyncHandler(async (req, res) => {
  const { mangaId } = req.body;
  try {
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      // Kiểm tra bộ manga này đã trong list yêu thích chưa
      const existManga = user.followingManga.find(
        (r) => r._id.toString() === mangaId.toString()
      );
      const manga = await MangaModel.findById(mangaId);
      const manganame = manga.nameOnUrl + "-" + manga._id.toString();
      const [behavior, mangaid] = await addBehavior(user, manganame);
      const behaviorItem = await behavior.behaviorList.find(
        (b) => b.mangaId.toString() === mangaid.toString()
      );
      //Nếu manga đã thích
      if (existManga && manga.follow.includes(req.user._id)) {
        res.status(400);
        throw new Error("Phim đã có trong list yêu thích");
      }
      //Nếu chưa thích
      user.followingManga.push(mangaId);
      manga.follow.push(req.user._id);
      manga.numberOfFollows = manga.follow.length;
      behaviorItem.isFollow = true;
      await user.save();
      await manga.save({ timestamps: false });
      await behavior.save();
      res.json(user.followingManga);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete manga following
// @route DELETE /api/users/follow/:id
// @access Private
const deleteFollowingManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      // await user.updateOne({
      //   $pull: { followingManga: req.params.id.toString() },
      // });
      const manga = await MangaModel.findById(req.params.id);
      const manganame = manga.nameOnUrl + "-" + manga._id.toString();
      const [behavior, mangaId] = await addBehavior(user, manganame);
      const behaviorItem = await behavior.behaviorList.find(
        (b) => b.mangaId.toString() === mangaId.toString()
      );
      user.followingManga.pull(req.params.id);
      await manga.updateOne(
        {
          $pull: { follow: req.user._id.toString() },
        },
        { timestamps: false }
      );
      manga.numberOfFollows =
        manga.numberOfFollows > 0 ? manga.follow.length - 1 : 0;
      behaviorItem.isFollow = false;
      await user.save();
      await manga.save({ timestamps: false });
      await behavior.save();
      res.json({ message: "Manga yêu thích đã được xóa" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete all manga following
// @route DELETE /api/users/follow
// @access Private
const deleteAllFollowingManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const mangas = await MangaModel.find({});
      mangas.forEach(async (manga) => {
        const userIndex = manga.follow.indexOf(req.user._id);

        if (userIndex !== -1) {
          await manga.updateOne({
            $pull: { follow: req.user._id.toString() },
          });
          manga.numberOfFollows =
            manga.numberOfFollows > 0 ? manga.numberOfFollows - 1 : 0;
          await manga.save();
        }
      });
      user.followingManga = [];
      await user.save();
      res.json({ message: "Đã xóa hết những bộ manga yêu thích của bạn" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all following manga
// @route GET /api/user/comment
// @access Private
const getCommentUser = asyncHandler(async (req, res) => {
  const { page } = req.query;
  try {
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const commentList = await CommentModel.aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "mangas",
            localField: "mangaId",
            foreignField: "_id",
            as: "manga",
          },
        },
        {
          $addFields: {
            mangaImage: { $arrayElemAt: ["$manga.image", 0] },
            mangaName: { $arrayElemAt: ["$manga.name", 0] },
            mangaNameOnUrl: { $arrayElemAt: ["$manga.nameOnUrl", 0] },
          },
        },
        {
          $project: {
            commentContent: 1,
            mangaId: 1,
            mangaImage: 1,
            mangaName: 1,
            mangaNameOnUrl: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]);
      renderComment(res, commentList, 36, page);
      // res.json(commentList);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all Notification
// @route GET /api/user/notification
// @access Private
const getNotificationUser = asyncHandler(async (req, res) => {
  // const { page } = req.query;
  try {
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const notificationList = await NotificationModel.aggregate([
        { $match: { userId: user._id, enable: 1 } },
        { $sort: { createdAt: -1 } },
        { $limit: 15 },
      ]);
      res.json(notificationList);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Hidden Notification
// @route PATCH /api/user/notification
// @access Private
const hiddenNotificationUser = asyncHandler(async (req, res) => {
  // const { page } = req.query;
  try {
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const notification = await NotificationModel.findById(req.params.id);
      notification.enable = 0;
      await notification.save();
      res.json(notification);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get data read
// @route GET /api/user/dataread/:manganame
// @access Private
const getDataReadUser = asyncHandler(async (req, res) => {
  const { manganame } = req.params;
  try {
    const mangaName = manganame.substring(0, manganame.lastIndexOf("-"));
    //Tìm tk
    const user = await User.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const manga = await MangaModel.findOne({ nameOnUrl: mangaName });
      const dataRead =
        user.followingManga.length > 0
          ? user.followingManga.find(
              (data) => data._id.toString() === manga._id.toString()
            )
          : {};
      const chapName =
        dataRead !== undefined &&
        dataRead.readChapter !== null &&
        Object.keys(dataRead).length !== 0
          ? manga.chapter.find(
              (chap) => chap._id.toString() === dataRead.readChapter.toString()
            ).chapName
          : null;
      res.json({ dataRead, chapName });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ******** ADMIN CONTROLLERS ***********
// @desc Get all user
// @route GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  try {
    // Tìm all tk in DB
    const users = await User.aggregate([
      {
        $lookup: {
          from: "warnings", // Tên của collection chứa thông tin cảnh báo
          localField: "_id",
          foreignField: "userId",
          as: "warnings",
        },
      },
      {
        $unwind: {
          path: "$warnings",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          numberOfWarnings: "$warnings.numberOfWarnings",
          enable: 1,
          isAdmin: 1,
        },
      },
    ]);
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete user
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.params.id);
    // Nếu tk tồn tại
    if (user) {
      // Nếu tài khoản là Admin
      if (user.isAdmin) {
        res.status(400);
        throw new Error("Tài khoản Admin không thể xóa");
      }
      deleteFromUser(user._id, req.user._id);
      // else => xóa
      await user.deleteOne();
      // Cập nhật các liên kết trong collection Manga
      res.json({ message: "Tài khoản đã xóa" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Enable user
// @route PATCH /api/users/enable/:id
// @access Private/Admin
const enableUser = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.params.id);
    // Nếu tk tồn tại
    if (user) {
      // Nếu tài khoản là Admin
      if (user.isAdmin) {
        res.status(400);
        throw new Error("Tài khoản Admin không thể cập nhật");
      }
      user.enable = !user.enable;
      await user.save();
      // Cập nhật các liên kết trong collection Manga
      res.json({ message: "Tài khoản đã cập nhật" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Set Admin user
// @route PATCH /api/users/admin/:id
// @access Private/Admin
const setAdminUser = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.params.id);
    // Nếu tk tồn tại
    if (user) {
      // Nếu tài khoản là Admin
      // if (user.isAdmin) {
      //   res.status(400);
      //   throw new Error("Tài khoản Admin không thể cập nhật");
      // }
      user.isAdmin = true;
      await user.save();
      // Cập nhật các liên kết trong collection Manga
      res.json({ message: "Tài khoản đã được cập nhật thành Admin" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Ratting manga
// @route POST /api/manga/rating/:manganame
// @access Private
const ratingManga = asyncHandler(async (req, res) => {
  const { manganame } = req.params;
  try {
    const mangaName = manganame.substring(0, manganame.lastIndexOf("-"));
    const user = await User.findById(req.user._id);
    if (user) {
      const manga = await MangaModel.findOne({
        nameOnUrl: mangaName,
      });
      const existUser = await manga.rate.find(
        (r) => r._id.toString() === user._id.toString()
      );
      if (existUser) {
        existUser.rating = req.body.rate;
      } else {
        const rate = {
          _id: user._id,
          rating: req.body.rate,
        };
        manga.rate.push(rate);
      }
      // const manganame = manga.nameOnUrl + "-" + manga._id.toString();
      const [behavior, mangaid] = await addBehavior(user, manganame);
      const behaviorItem = await behavior.behaviorList.find(
        (b) => b.mangaId.toString() === mangaid.toString()
      );
      behaviorItem.rating = req.body.rate;
      await behavior.save();
      await manga.save({ timestamps: false });
      await axios.post("http://127.0.0.1:8000/rating", {
        userId: user._id,
        mangaId: manga._id,
        // mangaId: "662a9e78d2a9173d53c01ba2",
        rate: req.body.rate,
      });
      res.status(201).json(manga);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const deleteFromUser = async (userId, adminId) => {
  try {
    await MangaModel.updateMany(
      {
        $or: [
          { memberJoin: userId },
          { "rate._id": userId },
          { follow: userId },
        ],
      },
      {
        $pull: {
          memberJoin: userId,
          rate: { _id: userId },
          follow: userId,
        },
      },
      { multi: true, new: true, timestamps: false }
    );
    await MangaModel.updateMany(
      { ownership: userId },
      // { $set: { ownership: null } },
      { $set: { ownership: adminId } },
      { multi: true, new: true, timestamps: false }
    );
    await MangaModel.updateMany(
      { "chapter.postedUser": userId },
      // { $set: { "chapter.$[elem].postedUser": adminId } },
      {
        $set: { "chapter.$[elem].postedUser": null },
      },
      {
        // arrayFilters: [{ "elem.postedUser": adminId }],
        arrayFilters: [{ "elem.postedUser": userId }],
        multi: true,
        new: true,
        timestamps: false,
      },
      { multi: true, new: true, timestamps: false }
    );
    await BehaviorModel.findOneAndDelete({ userId: userId });
    await CommentModel.deleteMany({ userId: userId });
    await CommentModel.updateMany(
      {
        $or: [
          { "feedBack.userId": userId },
          { "feedBack.feedBackToId": userId },
        ],
      },
      {
        $pull: {
          feedBack: {
            $or: [{ userId: userId }, { feedBackToId: userId }],
          },
        },
      },
      { multi: true }
    );
    await HistoryModel.findOneAndDelete({ userId: userId });
    await WarningModel.findOneAndDelete({ userId: userId });
  } catch (error) {
    throw new Error(error.message);
  }
};

const getMangaInfoForFollowingManga = async (res, array, page) => {
  const mangaFollow = [];
  for (let i = 0; i < array.length; i++) {
    const mangaId = array[i]._id; // Lấy _id của từng phần tử

    try {
      // Tìm thông tin manga từ MangaModel bằng _id
      const mangaInfo = await MangaModel.aggregate([
        { $match: { _id: mangaId } },
        { $match: { enable: 1 } },
        {
          $addFields: {
            chapterNameReading: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$chapter",
                        as: "ch",
                        cond: { $eq: ["$$ch._id", array[i].readChapter] },
                      },
                    },
                    as: "filteredChapter",
                    in: "$$filteredChapter.chapName",
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $set: {
            chapter: {
              $slice: [
                {
                  $filter: {
                    input: {
                      $sortArray: {
                        input: "$chapter",
                        sortBy: { chapName: -1 },
                      },
                    },
                    as: "c",
                    cond: { $eq: ["$$c.enable", 1] },
                  },
                },
                3,
              ],
            },
          },
        },
        {
          $addFields: {
            readChapter: array[i].readChapter,
            readedChapter: array[i].readedChapter,
            lastRead: array[i].updatedAt,
          },
        },
        {
          $project: {
            name: 1,
            nameOnUrl: 1,
            image: 1,
            numberOfChapters: 1,
            numberOfViews: 1,
            numberOfFollows: 1,
            numberOfComments: 1,
            "chapter._id": 1,
            "chapter.chapName": 1,
            "chapter.updatedAt": 1,
            totalViewInMonthOld: 1,
            status: 1,
            readChapter: 1,
            chapterNameReading: 1,
            readedChapter: 1,
            lastRead: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);
      if (mangaInfo[0] !== undefined) mangaFollow.push(mangaInfo[0]);
    } catch (error) {
      console.error("Error retrieving manga info:", error);
    }
  }
  const mangaList = mangaFollow.sort((a, b) => b.updatedAt - a.updatedAt);
  render(res, mangaList, 36, page);
};

export {
  registerUser,
  verifyEmail,
  resendEmailVerificationToken,
  forgetPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  loginUser,
  loginGoogle,
  loginGoogleSucces,
  getUserInfo,
  updateUserProfile,
  deleteUserProfile,
  changeUserPassword,
  createUserPassword,
  getFollowingManga,
  getAllFollowingManga,
  addFollowingManga,
  deleteFollowingManga,
  deleteAllFollowingManga,
  getCommentUser,
  getNotificationUser,
  hiddenNotificationUser,
  getDataReadUser,
  getUsers,
  deleteUser,
  enableUser,
  setAdminUser,
  ratingManga,
};
