const QUEUE_URLS = [
  "https://crs-digital-factory.vercel.app/crs99/opportunities.json",
  "https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99/opportunities.json"
];

async function fetchQueue() {
  const errors = [];

  for (const url of QUEUE_URLS) {
    try {
      const response = await fetch(`${url}?t=${Date.now()}`, {
        cache: "no-store",
        credentials: "omit"
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      errors.push(`${url}: ${String(error?.message || error)}`);
    }
  }

  throw new Error(`Fila CRS indisponível. ${errors.join(" | ")}`);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CRS99_GET_QUEUE") return;

  (async () => {
    try {
      const data = await fetchQueue();
      sendResponse({ ok: true, data });
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.message || error) });
    }
  })();

  return true;
});
