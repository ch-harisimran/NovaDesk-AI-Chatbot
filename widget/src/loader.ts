/**
 * NovaDesk AI -- embeddable widget loader.
 *
 * This is the ONLY file a host site includes:
 *   <script src="http://localhost:5173/widget.js" data-tenant-id="YOUR_TENANT_ID"></script>
 *
 * It is a dependency-free vanilla script (bundled as a single IIFE) so it
 * can't clash with anything on the host page. All it does is:
 *   1. Read its own <script> tag's data attributes.
 *   2. Create a small fixed-position container + an <iframe> pointing at the
 *      actual widget SPA (a completely separate document -- the host page's
 *      CSS can never reach inside it, and the widget's CSS can never leak
 *      out, regardless of same- or cross-origin).
 *   3. Resize that container in response to postMessage events the widget
 *      SPA sends when it opens/closes.
 */
(function () {
  function currentScript(): HTMLScriptElement {
    const el = document.currentScript as HTMLScriptElement | null;
    if (el) return el;
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  }

  const script = currentScript();
  const tenantId = script.getAttribute("data-tenant-id") || "";
  const apiUrl = script.getAttribute("data-api-url") || "http://localhost:4000";

  if (!tenantId) {
    console.error("[NovaDesk] widget.js is missing a required data-tenant-id attribute.");
    return;
  }

  // Derive the widget app's own origin from wherever widget.js itself was loaded from.
  const scriptUrl = new URL(script.src);
  const widgetAppUrl = new URL("/", scriptUrl.origin);
  widgetAppUrl.searchParams.set("tenantId", tenantId);
  widgetAppUrl.searchParams.set("apiUrl", apiUrl);

  const CLOSED_SIZE = { width: 96, height: 96 };
  const OPEN_SIZE_DESKTOP = { width: 400, height: 660 };

  function isMobile() {
    return window.innerWidth < 640;
  }

  const container = document.createElement("div");
  container.id = "novadesk-widget-container";
  Object.assign(container.style, {
    position: "fixed",
    zIndex: "2147483000",
    bottom: "0",
    right: "0",
    width: CLOSED_SIZE.width + "px",
    height: CLOSED_SIZE.height + "px",
    border: "0",
    background: "transparent",
    transition: "width 0.35s cubic-bezier(0.32, 0.72, 0, 1), height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
    colorScheme: "normal",
  } as CSSStyleDeclaration);

  const iframe = document.createElement("iframe");
  iframe.title = "NovaDesk AI chat widget";
  iframe.src = widgetAppUrl.toString();
  iframe.setAttribute("allow", "microphone");
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "0",
    background: "transparent",
    colorScheme: "normal",
  } as CSSStyleDeclaration);

  container.appendChild(iframe);

  function mount() {
    document.body.appendChild(container);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== "novadesk-widget") return;

    if (data.type === "resize") {
      const mobile = isMobile();
      if (data.open) {
        if (mobile) {
          Object.assign(container.style, { width: "100vw", height: "100vh", bottom: "0", right: "0" });
        } else {
          Object.assign(container.style, {
            width: OPEN_SIZE_DESKTOP.width + "px",
            height: OPEN_SIZE_DESKTOP.height + "px",
            bottom: "0",
            right: "0",
          });
        }
      } else {
        Object.assign(container.style, { width: CLOSED_SIZE.width + "px", height: CLOSED_SIZE.height + "px" });
      }
    }
  });
})();
