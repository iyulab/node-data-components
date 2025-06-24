// theme.ts
import dark from "devextreme/dist/css/dx.dark.css?inline";
import light from "devextreme/dist/css/dx.light.css?inline";

let isThemeApplied = false; // 테마 적용 여부를 추적하는 플래그

function applyTheme() {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  updateStyleTag(theme === 'dark' ? dark : light);
}

function updateStyleTag(cssContent: string) {
  let styleTag = document.getElementById('theme-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'theme-style';
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = cssContent;
}

// 한번만 실행되도록 합니다.
if (!isThemeApplied) {
  applyTheme();

  const observer = new MutationObserver(() => {
    applyTheme();
  });

  observer.observe(document.documentElement, { attributes: true });

  isThemeApplied = true;
}