/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */
import Axios from 'axios';
import { getActions, getGlobal } from '../global';
import type { Message } from '../global/types';

const HEIGHT_HEADER_FIXED = 56;

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
 * TL - This function will active expand header in inactive tab folder whenever it is activated in current tab.
 */
export function handleScrollUnactiveTab() {
  // eslint-disable-next-line max-len
  const elements = document.querySelectorAll('#custom-id-chat-list-inf-scroll.chat-list.custom-scroll.Transition_slide');
  const isExpandHeader = sessionStorage.getItem('isExpandHeader');
  if (elements) {
    if (elements.length > 0) {
      elements.forEach((item) => {
        item.scrollTo({ top: isExpandHeader === 'true' ? 0 : HEIGHT_HEADER_FIXED });
      });
    }
  }
}

/**
 * TL - Send push notification
 */
export function sendPushNotification(message: string) {
  (window as any).webkit?.messageHandlers.onShowSnackBar.postMessage({ message });
}

/**
 * TL - Custom function to get current user data
 */
export function handleGetUserInfo() {
  const userById = getGlobal().users.byId;
  for (const key of Object.keys(userById)) {
    if (userById[key].hasOwnProperty('isSelf')) {
      (window as any).webkit?.messageHandlers.getUserInfo.postMessage(JSON.stringify(userById[key]));
      return;
    }
  }
  (window as any).webkit?.messageHandlers.getUserInfo.postMessage('No Data');
}

/**
 * TL - Custom function to get base64 encode image data from blob url
 */
const getBlobData = (url: string) => {
  return new Promise((resolve, reject) => {
    Axios({
      method: 'GET',
      url,
      responseType: 'blob',
    }).then((response) => {
      const reader = new FileReader();
      reader.readAsDataURL(response.data);
      reader.onloadend = () => {
        resolve(reader.result);
      };
    }).catch((error) => reject(error));
  });
};

/**
 * TL - This function which send contact list of this account to Native App
 */
export async function handleGetContacts() {
  const imageList = JSON.parse(window.sessionStorage.getItem('imageList') ?? '[]');
  getGlobal().contactList?.userIds.forEach((id) => {
    const isExist = imageList.some((contact: { id: string; imgBlobUrl: string }) => contact.id === id);
    if (!isExist) {
      imageList.push({
        id,
        imgBlobUrl: '',
      });
    }
  });
  const contacts = [];
  for (const contact of imageList) {
    const { id, imgBlobUrl } = contact;
    const userData = getGlobal().users.byId[id];
    if (!userData?.isSelf) {
      let temp = {};
      if (imgBlobUrl) {
        temp = {
          ...userData,
          photoBase64: await getBlobData(imgBlobUrl),
        };
      } else {
        temp = userData;
      }
      contacts.push(temp);
    }
  }
  if (contacts.length === getGlobal().contactList!.userIds.length - 1) {
    (window as any).webkit?.messageHandlers.onContactsReceived.postMessage(JSON.stringify(contacts));
  }
}
