import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { storage } from "@/utils/storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type:
    | "friend_request"
    | "trail_alert"
    | "adventure_invite"
    | "sos_alert"
    | "message"
    | "achievement"
    | "trail_update";
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  async initialize() {
    try {
      if (Platform.OS === "web") {
        console.log("Push notifications are not supported on web");
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return null;
      }

      // Set up default Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF6B35",
        });
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.log(
          "Push notifications initialized without token (no Expo projectId found)",
        );
        return null;
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      this.expoPushToken = pushTokenData.data;
      await storage.saveExpoPushToken(this.expoPushToken);
      console.log("Expo push token registered:", this.expoPushToken);

      this.setupListeners();
      return this.expoPushToken;
    } catch (error) {
      console.log("Notifications not available on this platform:", error);
      return null;
    }
  }

  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (
      response: Notifications.NotificationResponse,
    ) => void,
  ) {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      },
    );

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      });
  }

  removeListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  async scheduleLocalNotification(
    notification: NotificationData,
    seconds: number = 0,
  ) {
    try {
      const trigger = seconds > 0 ? { seconds, repeats: false } : null;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { ...notification.data, type: notification.type },
          sound: true,
        },
        trigger: trigger as any,
      });
      return id;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  async sendFriendRequestNotification(friendName: string, friendId: string) {
    return this.scheduleLocalNotification({
      type: "friend_request",
      title: "New Friend Request",
      body: `${friendName} wants to connect with you!`,
      data: { friendId },
    });
  }

  async sendTrailAlertNotification(
    trailName: string,
    alertType: string,
    severity: string,
  ) {
    return this.scheduleLocalNotification({
      type: "trail_alert",
      title: `Trail Alert: ${trailName}`,
      body: `${alertType} - ${severity}`,
      data: { trailName, alertType, severity },
    });
  }

  async sendAdventureInviteNotification(friendName: string, trailName: string) {
    return this.scheduleLocalNotification({
      type: "adventure_invite",
      title: "Adventure Invitation",
      body: `${friendName} invited you to explore ${trailName}`,
      data: { friendName, trailName },
    });
  }

  async sendSOSAlertNotification(friendName: string, location: string) {
    return this.scheduleLocalNotification({
      type: "sos_alert",
      title: "🚨 Emergency SOS Alert",
      body: `${friendName} needs help at ${location}`,
      data: { friendName, location },
    });
  }

  async sendMessageNotification(senderName: string, messagePreview: string) {
    return this.scheduleLocalNotification({
      type: "message",
      title: `Message from ${senderName}`,
      body: messagePreview,
      data: { senderName },
    });
  }

  async sendAchievementNotification(
    achievementName: string,
    description: string,
  ) {
    return this.scheduleLocalNotification({
      type: "achievement",
      title: "🏆 Achievement Unlocked!",
      body: `${achievementName}: ${description}`,
      data: { achievementName },
    });
  }

  async sendTrailUpdateNotification(trailName: string, updateType: string) {
    return this.scheduleLocalNotification({
      type: "trail_update",
      title: `Trail Update: ${trailName}`,
      body: updateType,
      data: { trailName, updateType },
    });
  }

  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async getPendingNotifications() {
    return await Notifications.getPresentedNotificationsAsync();
  }

  async dismissNotification(notificationId: string) {
    await Notifications.dismissNotificationAsync(notificationId);
  }

  async dismissAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }
}

export const notificationService = new NotificationService();
