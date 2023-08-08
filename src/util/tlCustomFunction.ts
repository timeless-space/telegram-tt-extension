/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */
import { getActions } from '../global';
import type { Message } from '../global/types';

export function changePaddingTopMobile(padding = 0) {
  const element1: any = document.getElementById('left-main-header');
  const element2: any = document.getElementById('custom-id-chat-list-inf-scroll');

  element1.style.paddingTop = `${Number(padding) / 1.15 + 10}px`;
  element2.style.paddingTop = `${Number(padding) / 1.15 + 10}px`;
}

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
