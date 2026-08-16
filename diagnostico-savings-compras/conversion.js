(() => {
  "use strict";
  const form = document.getElementById("savingsDiagnosticForm");
  const result = document.getElementById("result");
  if (!form || !result) return;

  function recommendation(score) {
    if (score < 35) return [
      `Nota ${score}/100: antes do dashboard, organize a base do saving.`,
      "O Painel Pro reúne baseline, iniciativa, responsável, status, evidência, saving potencial e reconhecido na mesma base.",
      "Ver uma estrutura pronta",
      "diagnostico-savings-nota-baixa-pro"
    ];
    if (score < 60) return [
      `Nota ${score}/100: você já calcula, mas ainda há pontos frágeis para defender o número.`,
      "O Painel Pro organiza até 200 iniciativas, evidências, status, baseline e metas para facilitar acompanhamento e fechamento.",
      "Ver como o Painel organiza isso",
      "diagnostico-savings-nota-media-pro"
    ];
    if (score < 85) return [
      `Nota ${score}/100: o ganho agora é manter o processo repetível mês após mês.`,
      "O Painel Pro centraliza carteira, metas, checks e dashboard, separando saving potencial de reconhecido.",
      "Conhecer o Painel Pro",
      "diagnostico-savings-nota-boa-pro"
    ];
    return [
      `Nota ${score}/100: você já cobre os fundamentos.`,
      "Se a dificuldade agora for consolidar muitas iniciativas, metas e evidências, veja a estrutura do Painel Pro. Se seu processo atual já resolve isso bem, não há motivo para trocar apenas por trocar.",
      "Comparar com meu processo atual",
      "diagnostico-savings-nota-alta-pro"
    ];
  }

  function install() {
    const score = Number(document.getElementById("score")?.textContent || "");
    if (!Number.isFinite(score)) return;
    const [title, text, cta, track] = recommendation(score);
    let card = document.getElementById("diagnosticProReason");
    if (!card) {
      card = document.createElement("section");
      card.id = "diagnosticProReason";
      card.style.cssText = "margin:18px 0;padding:18px;border:1px solid rgba(116,204,255,.35);border-radius:16px;background:rgba(116,204,255,.07)";
      const sharebox = result.querySelector(".sharebox");
      if (sharebox) result.insertBefore(card, sharebox); else result.appendChild(card);
    }
    card.innerHTML = `<span style="display:block;color:#74ccff;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px">Próximo passo opcional</span><strong style="display:block;font-size:19px;line-height:1.25;margin-bottom:8px">${title}</strong><p style="margin:0 0 13px;color:#c4d0de;line-height:1.5">${text}</p><a href="/painel-savings-compras-pro/?utm_source=diagnostico-savings&utm_medium=result&utm_campaign=primeira-venda-savings&utm_content=nota-${score}" data-crs-track-content="${track}" style="display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 15px;border-radius:12px;background:linear-gradient(135deg,#74ccff,#45e0c4);color:#06111e;text-decoration:none;font-weight:900">${cta} →</a>`;
  }

  form.addEventListener("submit", () => window.setTimeout(install, 0));
  document.getElementById("diagExampleBtn")?.addEventListener("click", () => window.setTimeout(install, 0));
})();