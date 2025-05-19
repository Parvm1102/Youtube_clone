import { Router } from "express";
import { changeCurrentPassword, getCurrentUSer, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router()
router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/getuser").post(verifyJWT, getCurrentUSer)
router.route("/change-fullName-email").post(verifyJWT, updateAccountDetails)

router.route("/change-avatar").post(upload.single("avatar"), verifyJWT, updateUserAvatar)

router.route("/change-coverImage").post(upload.single("coverImage"), verifyJWT, updateUserCoverImage)
export default router;