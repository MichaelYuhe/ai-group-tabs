let ToastContainer: HTMLDivElement | null = null;
const html = String.raw;

/**
 * DO NOT USE FOR USER INPUT
 *
 * See https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 */
const htmlToElement = <T extends ChildNode>(html: string) => {
  const template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild as T;
};

const createToastContainer = () => {
  const styles = `
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
  `;
  const template = html`<div class="toast-container" style="${styles}"></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  const container = document.body;
  container.appendChild(element);
  return element;
};

type ToastOptions = {
  type: "info" | "success" | "warn" | "error";
  message: string;
  duration: number;
};

const defaultToastOptions: ToastOptions = {
  type: "info",
  message: "",
  duration: 2500,
};

// Ported from https://tailwindui.com/components/application-ui/feedback/alerts
const toastTypeStyles = {
  info: `
    color: rgb(29 78 216);
    background: rgb(239 246 255);
  `,
  success: `
    color: rgb(21 128 61);
    background: rgb(240 253 244);
  `,
  warn: `
    color: rgb(161 98 7);
    background: rgb(254 252 232);
  `,
  error: `
    color: rgb(185 28 28);
    background: rgb(254 242 242);
    `,
} as const;

/**
 * @example
 * ```ts
 * toast('Hello World');
 * toast({ message: 'Hello World', type: 'info' });
 * ```
 */
export function toast(message: string): HTMLDivElement;
export function toast(message: Partial<ToastOptions>): HTMLDivElement;
export function toast(messageOrOptions: string | Partial<ToastOptions>) {
  const toastOptions: ToastOptions =
    typeof messageOrOptions === "string"
      ? { ...defaultToastOptions, message: messageOrOptions }
      : { ...defaultToastOptions, ...messageOrOptions };
  if (!ToastContainer) {
    ToastContainer = createToastContainer();
  }

  const toastStyles = `
    width: 100%;
    font-family: 'Inter', 'Source Sans 3', Poppins, apple-system, BlinkMacSystemFont,'Helvetica Neue', Tahoma, 'PingFang SC', 'Microsoft Yahei', Arial,'Hiragino Sans GB', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji','Segoe UI Symbol', 'Noto Color Emoji';
    font-size: 14px;
    padding: 6px 12px;
    margin: 10px 0 0 0;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, .05), 0px 0px 0px .5px rgba(0, 0, 0, .1);
    transition: all 230ms cubic-bezier(0.21, 1.02, 0.73, 1);
    opacity: 0;
    ${toastTypeStyles[toastOptions.type]}
  `;

  const template = html`<div style="${toastStyles}"></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  // use textContent instead of innerText to avoid XSS
  element.textContent = toastOptions.message;
  // We can only create one toast at a time since there is no enough space.
  ToastContainer.innerHTML = "";
  ToastContainer.appendChild(element);

  const fadeIn = [
    {
      opacity: 0,
    },
    { opacity: 1 },
  ];
  const animationOptions = {
    duration: 230,
    easing: "cubic-bezier(0.21, 1.02, 0.73, 1)",
    fill: "forwards" as const,
  }; // satisfies KeyframeAnimationOptions;
  element.animate(fadeIn, animationOptions);

  setTimeout(async () => {
    const fadeOut = fadeIn.reverse();
    const animation = element.animate(fadeOut, animationOptions);
    await animation.finished;
    element.remove();
  }, toastOptions.duration);
  return element;
}
