import asyncHandler from "express-async-handler";
import Role from "../models/RoleModel.js";

// ******** PUBLIC CONTROLLERS ***********
// @desc get all role
// @route GET /api/role
// @access Private/Admin
const getRole = asyncHandler(async (req, res) => {
  try {
    // Tìm tất cả thể loại trong database
    const role = await Role.find({});
    // Gửi tất cả thể loại lên client
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ******** ADMIN CONTROLLERS ***********
// @desc create new role
// @route POST /api/role
// @access Private/Admin
const createRole = asyncHandler(async (req, res) => {
  try {
    // Lấy title từ request body
    const { roleName } = req.body;
    // Kiểm tra đã có vai trò này chưa
    const roleExist = await Role.find({ roleName: roleName });
    //roleExist.title.includes(title)
    if (roleExist.length > 0) {
      res.status(400);
      throw new Error("Đã có sẵn vai trò này");
    }
    // Tạo mới vai trò
    const role = await Role({ roleName });
    // Lưu vai trò vào db
    const createdRole = await role.save();
    // Gửi tất cả vai trò lên client
    res.status(201).json(createdRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export { getRole, createRole };
