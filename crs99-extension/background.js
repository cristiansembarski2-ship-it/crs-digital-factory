const QUEUE_URL = "https://crs-digital-factory.vercel.app/crs99/opportunities.json";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CRS99_GET_QUEUE") return;

  (async () => {
    try {
      const response = await fetch(`${QUEUE_URL}?t=${Date.now()}`, {
        cache: "no-store",
        credentials: "omit"
      });

      if (!response.ok) {
        throw new Error(`Fila CRS indisponível (${response.status})`);
      }

      const data = await response.json();
      sendResponse({ ok: true, data });
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.message || error) });
    }
  })();

  return true;
});
