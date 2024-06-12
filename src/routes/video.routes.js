import { Router } from "express"
import {publishAVideo,getVideoById,updateVideo} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/videoPublish").post(
    upload.fields([
        {name:Video,
        maxCount:1}
    ]),publishAVideo
)
router.route("/current-video").get(verifyJWT,getVideoById)
router.route("/updateVideo-detials").patch(verifyJWT,updateVideo)

export default router