import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/Auth.js";
import { generateMailTransporter, generateOTP } from "../utils/mail.js";
import EmailVerificationToken from "../models/EmailVerificationToken.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { sendError, generateRandomByte } from "../utils/helper.js";
import MangaModel from "../models/MangaModel.js";

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
      email,
      password: hashedPassword,
      image,
      isAdmin: admin,
      role,
    });

    // if user created successfully send user data and token to client
    if (user) {
      // Bổ sung thêm
      // //generate 6 digit OTP
      // let OPT = generateOTP();

      // const newEmailVerificationToken = new EmailVerificationToken({
      //   owner: user._id,
      //   token: OPT,
      // });

      // await newEmailVerificationToken.save();

      // //send opt to user
      // var transport = generateMailTransporter();

      // transport.sendMail({
      //   from: "verification@manga.com",
      //   to: user.email,
      //   subject: "Email Verification",
      //   html: `
      //           <p>Your verification OTP</p>
      //           <h1>${OPT}</h1>
      //       `,
      // });

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        role: user.role,
        token: generateToken(user._id), // Test trc trên postman, đúng là phải đợi xác minh email đã mới được tạo token
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
  if (!isValidObjectId(userId)) return sendError(res, "Invalid user!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found!", 404);
  if (user.isVerified) return sendError(res, "User is already varified!");

  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "Token not found!");
  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please sumbit a valid OTP!");

  user.isVerified = true;
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  var transport = generateMailTransporter();
  transport.sendMail({
    from: "verification@manga.com",
    to: user.email,
    subject: "Welcome Email",
    html: `
            <h1> Welcome to our app and thanks for choosing us. </h1>
        `,
  });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
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
  if (alreadyHasToken)
    sendError(res, "Only after one hour you can request for another token!");
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
    from: "verification@manga.com",
    to: user.email,
    subject: "Welcome Email",
    html: `
            <p>Your verification OTP</p>
            <h1>${OPT}</h1>
        `,
  });
  res.json({ message: "New OTP has been send to your registed email account" });
});

// @desc Forget Password
// @route POST /api/users/forget-password
// @access Public
const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) sendError(res, "Please enter your email!");

  const user = await User.findOne({ email });
  if (!user) sendError(res, "Can not found your account", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user.id });
  if (alreadyHasToken)
    sendError(res, "After one hour you can request for another token!");

  const token = await generateRandomByte();
  const newpasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newpasswordResetToken.save();

  var resetPasswordUrl = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@manga.com",
    to: user.email,
    subject: "Reset Password Link",
    html: `
        <p>CLick here to reset password</p>
        <a href='${resetPasswordUrl}'>Change Password</a>
    `,
  });

  res.json({ message: "Link sent to your email!" });
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
  const { newPassword, userId } = req.body;
});

// @desc Login user
// @route POST /api/users/login
// @access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find account in db
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      sendError(res, "Email or password is invalid");
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
        token: generateToken(user._id),
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

// @desc Get all following manga
// @route GET /api/user/follow
// @access Private
const getFollowingManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await User.findById(req.user._id).populate("followingManga");
    // Nếu tk tồn tại
    if (user) {
      res.json(user.followingManga);
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
      //Nếu manga đã thích
      if (existManga && manga.follow.includes(req.user._id)) {
        res.status(400);
        throw new Error("Phim đã có trong list yêu thích");
      }
      //Nếu chưa thích
      user.followingManga.push(mangaId);
      manga.follow.push(req.user._id);
      manga.numberOfFollows = manga.follow.length;
      await user.save();
      await manga.save();
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
      user.followingManga.pull(req.params.id);
      await manga.updateOne({
        $pull: { follow: req.user._id.toString() },
      });
      manga.numberOfFollows =
        manga.numberOfFollows > 0 ? manga.follow.length - 1 : 0;
      await user.save();
      await manga.save();
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

// ******** ADMIN CONTROLLERS ***********
// @desc Get all user
// @route GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  try {
    // Tìm all tk in DB
    const users = await User.find({});
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

export {
  registerUser,
  verifyEmail,
  resendEmailVerificationToken,
  forgetPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  loginUser,
  updateUserProfile,
  deleteUserProfile,
  changeUserPassword,
  getFollowingManga,
  addFollowingManga,
  deleteFollowingManga,
  deleteAllFollowingManga,
  getUsers,
  deleteUser,
};
