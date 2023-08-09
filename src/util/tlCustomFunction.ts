/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */
import { getActions } from '../global';
import type { Message } from '../global/types';

/**
 * TL - Custom a sendMessage function to send a message
 */
export function handleSendMessage({ chatId, threadId = 0, text }: Message) {
  getActions().sendMessage({
    text,
    messageList: {
      chatId,
      threadId,
      type: 'thread',
    },
  });
}

/**
 * TL - Set session screen name
 */
export function sendScreenName(name: string) {
  (window as any).webkit?.messageHandlers.onScreenChanged.postMessage({ screenName: name });
}

/**
 * TL - Send push notification
 */
export function sendPushNotification(message: string) {
  (window as any).webkit?.messageHandlers.onShowSnackBar.postMessage({ message });
}
