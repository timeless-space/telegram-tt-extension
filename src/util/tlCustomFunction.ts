export function changePaddingTopMobile(padding = '0px') {
  const elList: any = document.getElementsByClassName('tl-custom-padding');
  for (const el of elList) {
    el.style.paddingTop = padding;
  }
  return true;
}
