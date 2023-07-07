/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */

import { getActions } from '../global';
import type { Message } from '../global/types';

export function changePaddingTopMobile(padding = '0px') {
  const elList: any = document.getElementsByClassName('tl-custom-padding');
  for (const el of elList) {
    el.style.paddingTop = padding;
  }
  return true;
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
