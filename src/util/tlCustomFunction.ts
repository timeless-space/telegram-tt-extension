export function changePaddingTopMobile(padding = '0px') {
  const element: any = document.getElementById('LeftColumn');
  element.style.top = padding;
  element.style.height = `calc(100vh - ${padding})`;
  return true;
}
