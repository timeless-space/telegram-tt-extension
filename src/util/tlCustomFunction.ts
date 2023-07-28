/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */

import { getGlobal } from '../global';

export function changePaddingTopMobile(padding = '0px') {
  const elList: any = document.getElementsByClassName('tl-custom-padding');
  for (const el of elList) {
    el.style.paddingTop = padding;
  }
  return true;
}

/**
 * TL - Set session screen name
 */
export function setScreenName(name: string) {
  getGlobal().screenName = name;
}

/**
 * TL - Add function get current screen name
 */
export function getCurrentScreen() {
  (window as any).webkit?.messageHandlers.jsHandler.postMessage(getGlobal().screenName);
}
