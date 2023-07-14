import { BOT_ID } from '../config';
import { getActions, getGlobal } from '../global';
import type { Group } from '../global/types';

/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */
export function changePaddingTopMobile(padding = 0) {
  const element1: any = document.getElementById('fix-issue-mobile');
  const element2: any = document.getElementById('custom-id-chat-list-inf-scroll');

  element1.style.paddingTop = `${padding}px`;
  element2.style.paddingTop = `${padding}px`;
}

/**
 * TL - This function is not done. If we want to create group with image, we need to crop image and upload it before creating group
 */
export function handleCreateGroup({ title }: Group) {
  if (getGlobal().currentUserId) {
    const currentMembers = [getGlobal().currentUserId ?? '', BOT_ID];

    getActions().createGroupChat({
      title,
      // photo: fileObj,
      memberIds: currentMembers,
    });

    const chatId = localStorage.getItem('chatIdOneTimeUse') ?? '';
    localStorage.setItem('chatIdOneTimeUse', '');
    return chatId;
  }
  return undefined;
}

/**
 * TL - Join group by hash string
 */
export function handleJoinGroup({ hash }: { hash: string }) {
  getActions().acceptInviteConfirmation({ hash });
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
