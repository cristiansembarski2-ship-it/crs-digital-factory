(() => {
  "use strict";

  const form = document.getElementById("maturityForm");
  const result = document.getElementById("result");
  if (!form || !result) return;

  const incoming = Number(new URLSearchParams(location.search).get("score"));
  const hasPeer = Number.isFinite(incoming) && incoming >= 0 && incoming <= 100;
  if (!hasPeer) return;

  function ownScore() {
    const values = Array.from({ length: 10 }, (_, i) => Number(document.getElementById("q" + i)?.value));
    if (values.some((value) => !Number.isFinite(value))) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / 40 * 100);
  }

  function labelDifference(diff) {
    if (diff === 0) return "Vocês chegaram exatamente à mesma percepção.";
    if (Math.abs(diff) <= 10) return "As percepções ficaram próximas.";
    if (diff > 0) return "Você avaliou a operação de forma mais madura que a pessoa que enviou o desafio.";
    return "Você avaliou a operação de forma menos madura que a pessoa que enviou o desafio.";
  }

  function renderComparison() {
    const score = ownScore();
    if (score === null) return;

    let panel = document.getElementById("peerComparison");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "peerComparison";
      panel.style.margin = "16px 0";
      panel.style.padding = "16px";
      panel.style.border = "1px solid rgba(116,204,255,.35)";
      panel.style.borderRadius = "14px";
      panel.style.background = "rgba(116,204,255,.07)";
      const priorities = result.querySelector("h3");
      if (priorities) result.insertBefore(panel, priorities);
      else result.appendChild(panel);
    }

    const diff = score - incoming;
    const sign = diff > 0 ? "+" : "";
    panel.innerHTML = `
      <span style="display:block;color:#74ccff;font-weight:900;text-transform:uppercase;font-size:12px;letter-spacing:.08em;margin-bottom:7px">Desafio entre colegas concluído</span>
      <strong style="display:block;font-size:22px;margin-bottom:8px">Você: ${score}/100 · Convite: ${incoming}/100</strong>
      <p style="margin:0;color:#c4d0de;line-height:1.5">Diferença: <b style="color:#f7f9fc">${sign}${diff} pontos</b>. ${labelDifference(diff)}</p>
      <p style="margin:8px 0 0;color:#9fb1c7;font-size:12px;line-height:1.45">Isso não mede quem está “certo”. Uma diferença pode ser útil para discutir onde o processo é percebido de maneiras diferentes.</p>
    `;

    try {
      if (typeof window.va === "function") {
        window.va("event", {
          name: "Procurement Maturity Peer Completed",
          data: { gapBand: Math.min(40, Math.floor(Math.abs(diff) / 10) * 10) }
        });
      }
    } catch (_) {
      // Analytics never blocks the result.
    }
  }

  form.addEventListener("submit", () => window.setTimeout(renderComparison, 0));
})();
