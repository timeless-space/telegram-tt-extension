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
export function sendScreenName(name: string) {
  (window as any).webkit?.messageHandlers.onScreenChanged.postMessage({ screenName: name });
}
