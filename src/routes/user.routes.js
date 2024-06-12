import { Router } from "express"
import { logOutUser,
    loginuser, 
    registerUser,
    refreshAccessToken,
    changeCurrentPassword, 
    getCurrrentUser,
    updateAccountDetails, 
    getUserChannel, 
    getUserWatchHistory } from "../controllers/user.controller.js"
    
import { upload } from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1

        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginuser)


//secured route
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/c/:username").get(verifyJWT,getUserChannel)
router.route("/Watchhistory").get(verifyJWT,getUserWatchHistory)


export default router