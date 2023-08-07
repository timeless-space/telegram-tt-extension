/**
 * TL - Add padding top
 * Description: Add padding top when called this function, all elements have 'tl-custom-padding' className will be change styles.
 */

export function changePaddingTopMobile(padding: string) {
  const element1: any = document.getElementById('left-main-header');
  const element2: any = document.getElementById('custom-id-chat-list-inf-scroll');

  element1.style.paddingTop = `${Number(padding)}px`;
  element2.style.paddingTop = `${Number(padding)}px`;
}
