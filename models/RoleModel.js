import mongoose from "mongoose";

const RoleSchema = mongoose.Schema(
  {
    roleName: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

RoleSchema.pre("remove", function (next) {
  const roleId = this._id;
  // Xóa các liên kết Role trong các User khi Role được xóa
  mongoose.model("User").updateMany(
    { role: roleId },
    { $unset: { role: "" } }, // Đặt trường role của user đó thành null
    next
  );
});

export default mongoose.model("Role", RoleSchema);
