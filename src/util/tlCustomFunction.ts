/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */

export function changePaddingTopMobile(padding = '0px') {
  const elList: any = document.getElementsByClassName('tl-custom-padding');
  for (const el of elList) {
    el.style.paddingTop = padding;
  }
  return true;
}
