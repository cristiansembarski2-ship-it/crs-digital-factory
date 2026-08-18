function allowedProjectUrl(value = "") {
  try {
    const url = new URL(String(value || ""));
    const host = url.hostname.toLowerCase();
    if (!["99freelas.com.br", "www.99freelas.com.br"].includes(host)) return null;
    if (!/^\/project\//i.test(url.pathname)) return null;
    url.protocol = "https:";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function visibleText(html = "") {
  return String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, available: false, reason: "method" });
  }

  const url = allowedProjectUrl(req.query?.url);
  if (!url) return res.status(400).json({ ok: false, available: false, reason: "invalid-url" });

  try {
    const response = await fetch(url.href, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.5"
      }
    });

    if (!response.ok) {
      return res.status(200).json({ ok: true, available: false, reason: `http-${response.status}`, checkedAt: new Date().toISOString() });
    }

    const html = await response.text();
    const text = visibleText(html).toLowerCase();
    const hasSendProposal = /(?:^|\s)enviar proposta(?:\s|$)/i.test(text);
    const hasWinner = text.includes("freelancer vencedor");
    const inProgress = /(?:^|\s)em andamento(?:\s|$)/i.test(text);
    const clearlyClosed = /projeto (?:foi )?(?:conclu[ií]do|cancelado|fechado)|n[aã]o (?:est[aá]|está) aceitando novas propostas|n[aã]o aceita novas propostas|encerrado para novas propostas/i.test(text);

    const available = Boolean(hasSendProposal && !hasWinner && !inProgress && !clearlyClosed);
    let reason = "open";
    if (!available) {
      if (hasWinner) reason = "winner";
      else if (inProgress) reason = "in-progress";
      else if (clearlyClosed) reason = "closed";
      else reason = "no-send-proposal";
    }

    return res.status(200).json({
      ok: true,
      available,
      reason,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      available: false,
      reason: "fetch-error",
      checkedAt: new Date().toISOString()
    });
  }
}
