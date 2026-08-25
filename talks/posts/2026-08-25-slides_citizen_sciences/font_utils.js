// Font utility for visualizations to inherit Quarto document fonts
// This module provides a consistent way to get document fonts for Plotly and other visualizations

export function getDocumentFontFamily() {
  const bodyStyle = window.getComputedStyle(document.body);
  let fontFamily = bodyStyle.fontFamily;
  if (!fontFamily || fontFamily === 'serif' || fontFamily === 'sans-serif') {
    const documentStyle = window.getComputedStyle(document.documentElement);
    fontFamily = documentStyle.fontFamily;
  }
  if (!fontFamily || fontFamily === 'serif' || fontFamily === 'sans-serif') {
    fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
  }
  return fontFamily;
}

export function getPlotlyFontConfig() {
  const fontFamily = getDocumentFontFamily();
  return {
    family: fontFamily,
    title: { size: 18, family: fontFamily },
    axis: { size: 14, family: fontFamily },
    tick: { size: 12, family: fontFamily },
    legend: { size: 12, family: fontFamily }
  };
}

export function applyDocumentFont(element, size) {
  const fontFamily = getDocumentFontFamily();
  element.style.fontFamily = fontFamily;
  if (size) element.style.fontSize = size;
}

export function getDocumentFontStyle(size) {
  const fontFamily = getDocumentFontFamily();
  let style = `font-family: ${fontFamily}`;
  if (size) style += `; font-size: ${size}`;
  return style;
}
