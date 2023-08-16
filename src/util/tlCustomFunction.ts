/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */
import Axios from 'axios';
import { getActions, getGlobal, setGlobal } from '../global';
import { callApi } from '../api/gramjs';
import { isUserId } from '../global/helpers';
import { addUsers, updateChat, updateUser } from '../global/reducers';
import { selectChat, selectUser, selectUserFullInfo } from '../global/selectors';
import type { Message } from '../global/types';
import { buildCollectionByKey } from './iteratees';

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
 * TL - Custom function to get current user's photos data
 * Inherit from GramJS FetchProfilePhotos method
 */
export async function tlFetchProfilePhotos(payload: any) {
  const { profileId } = payload!;
  const isPrivate = isUserId(profileId);

  let user = isPrivate ? selectUser(getGlobal(), profileId) : undefined;
  const chat = !isPrivate ? selectChat(getGlobal(), profileId) : undefined;
  if (!user && !chat) {
    return;
  }

  let fullInfo = selectUserFullInfo(getGlobal(), profileId);
  if (user && !fullInfo?.profilePhoto) {
    const { id, accessHash } = user;
    const result = await callApi('fetchFullUser', { id, accessHash });
    if (!result?.user) {
      return;
    }

    user = result.user;
    fullInfo = result.fullInfo;
  }

  const result = await callApi('fetchProfilePhotos', user, chat);
  if (!result || !result.photos) {
    return;
  }

  let global = getGlobal();
  const userOrChat = user || chat;
  const { photos, users } = result;
  photos.sort((a) => (a.id === userOrChat?.avatarHash ? -1 : 1));
  const fallbackPhoto = fullInfo?.fallbackPhoto;
  const personalPhoto = fullInfo?.personalPhoto;
  if (fallbackPhoto) photos.push(fallbackPhoto);
  if (personalPhoto) photos.unshift(personalPhoto);

  global = addUsers(global, buildCollectionByKey(users, 'id'));

  if (isPrivate) {
    global = updateUser(global, profileId, { photos });
  } else {
    global = updateChat(global, profileId, { photos });
  }

  setGlobal(global);

  // eslint-disable-next-line consistent-return
  return result;
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
  const contactList = JSON.parse(window.sessionStorage.getItem('contactList') ?? '[]');
  const contacts = [];
  for (const contact of contactList) {
    if (contact?.photoBlobUrl) {
      const temp = {
        ...contact,
        photoBase64: await getBlobData(contact.photoBlobUrl),
      };
      delete temp.photoBlobUrl;
      contacts.push(temp);
    } else {
      contacts.push(contact);
    }
  }
  return JSON.stringify(JSON.stringify(contacts));
}
