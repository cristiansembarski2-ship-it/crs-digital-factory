const ALLOWED_EVENTS = new Set([
  "Page View",
  "CTA Click",
  "Desafio Share",
  "Desafio Card Download",
  "Desafio Link Copy",
  "Desafio Example",
  "Desafio Send Approval",
  "Desafio Challenge Colleague",
  "Desafio Result Generated",
  "RFQ Copy",
  "RFQ Share",
  "RFQ Example",
  "RFQ Generated",
  "RFQ Link Created",
  "Hidden Cost Copy",
  "Hidden Cost Share",
  "Hidden Cost Example",
  "Hidden Cost Calculated",
  "Creator Case Generated",
  "Creator Copy",
  "Creator Share",
  "Savings Diagnostic Example",
  "Savings Diagnostic Share",
  "Savings Diagnostic Copy",
  "Savings Diagnostic Generated",
  "Savings Calculated",
  "Savings Result Shared",
  "Savings Result Pro Click",
  "RFQ Link Example",
  "RFQ Invite Shared",
  "RFQ Invite Copied",
  "RFQ Supplier View Opened",
  "RFQ Supplier Response Generated",
  "RFQ Response Shared",
  "RFQ Response Copied",
  "RFQ Response Added To Comparison",
  "RFQ New Request Started",
  "RFQ Template Loaded",
  "RFQ Supplier Landing",
  "RFQ Buyer Response Landing",
  "Proposal Example",
  "Proposal Shared",
  "Proposal Link Copied",
  "Proposal Printed",
  "Proposal Buyer Printed",
  "Proposal Buyer Becomes Supplier",
  "Proposal Generated"
]);

function clean(value, max = 120) {
  return String(value || "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\p{L}\p{N}\s._\-/:]/gu, "")
    .trim()
    .slice(0, max);
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const name = clean(body.name, 80);
  if (!ALLOWED_EVENTS.has(name)) return res.status(400).json({ ok: false });

  const event = {
    type: "crs_funnel_event",
    name,
    path: clean(body.path, 160),
    content: clean(body.content, 120),
    source: clean(body.source, 80),
    medium: clean(body.medium, 80),
    campaign: clean(body.campaign, 80),
    referrer: clean(body.referrer, 120),
    ts: new Date().toISOString()
  };

  console.log(JSON.stringify(event));
  return res.status(204).end();
}
