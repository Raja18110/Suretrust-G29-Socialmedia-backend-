import { getNotifications, triggerLikeNotification, markAllNotificationsAsRead, markNotificationAsRead, getUnreadNotificationCount } from "../controller/notification.controller.js";
import exoress from 'express'
import { authMiddleware } from "../utility/auth.Middleware.js";

const router=exoress.Router();


router.post("/like",authMiddleware,triggerLikeNotification);
router.get("/getNotifications",authMiddleware,getNotifications);
router.get("/unreadCount",authMiddleware,getUnreadNotificationCount);

router.put("/mark/:notificationId", authMiddleware, markNotificationAsRead);
router.put("/markAll", authMiddleware, markAllNotificationsAsRead);

export default router;