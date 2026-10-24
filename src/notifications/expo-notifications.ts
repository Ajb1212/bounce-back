/**
 * The parts of expo-notifications this app uses, imported from their own files.
 *
 * Why not `import * as Notifications from "expo-notifications"`? Its main file also loads the
 * push "topic subscription" module, which Expo Go on Android doesn't register, so the app
 * crashes at start with "Cannot find native module 'ExpoTopicSubscriptionModule'".
 * Bug: https://github.com/expo/expo/issues/52175 — once it's fixed, delete this file and
 * import from "expo-notifications" directly again.
 *
 * Everything else in the app imports notifications from here, never from the package.
 */
export { cancelAllScheduledNotificationsAsync } from "expo-notifications/build/cancelAllScheduledNotificationsAsync";
export { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
export { getAllScheduledNotificationsAsync } from "expo-notifications/build/getAllScheduledNotificationsAsync";
export { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
export { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
export {
  SchedulableTriggerInputTypes,
  type SchedulableNotificationTriggerInput,
} from "expo-notifications/build/Notifications.types";
export { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
export { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
export { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
