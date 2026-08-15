(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.CRS_SAVINGS_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function parseBrazilianNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;

    let normalized = String(value ?? "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/R\$/gi, "")
      .replace(/[^0-9,.-]/g, "");

    if (!normalized || normalized === "-" || normalized === "," || normalized === ".") {
      return NaN;
    }

    const commaIndex = normalized.lastIndexOf(",");
    const dotIndex = normalized.lastIndexOf(".");

    if (commaIndex >= 0) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (dotIndex >= 0) {
      const dotCount = (normalized.match(/\./g) || []).length;
      const decimalPlaces = normalized.length - dotIndex - 1;

      if (dotCount > 1) {
        normalized = decimalPlaces === 2
          ? normalized.slice(0, dotIndex).replace(/\./g, "") + "." + normalized.slice(dotIndex + 1)
          : normalized.replace(/\./g, "");
      } else if (decimalPlaces === 3 && /^-?\d{1,3}\.\d{3}$/.test(normalized)) {
        normalized = normalized.replace(".", "");
      }
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function calculateSavings(input) {
    const baselineUnit = parseBrazilianNumber(input.baselineUnit);
    const negotiatedUnit = parseBrazilianNumber(input.negotiatedUnit);
    const quantity = parseBrazilianNumber(input.quantity);

    const errors = {};

    if (!Number.isFinite(baselineUnit) || baselineUnit < 0) {
      errors.baselineUnit = "Informe um preço de referência válido, igual ou maior que zero.";
    }
    if (!Number.isFinite(negotiatedUnit) || negotiatedUnit < 0) {
      errors.negotiatedUnit = "Informe um preço negociado válido, igual ou maior que zero.";
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.quantity = "Informe uma quantidade maior que zero.";
    }

    if (Object.keys(errors).length) {
      return { ok: false, errors };
    }

    const baselineTotal = baselineUnit * quantity;
    const negotiatedTotal = negotiatedUnit * quantity;
    const differenceUnit = baselineUnit - negotiatedUnit;
    const savingsTotal = baselineTotal - negotiatedTotal;
    const savingsPercent = baselineTotal > 0 ? (savingsTotal / baselineTotal) * 100 : null;

    return {
      ok: true,
      baselineUnit,
      negotiatedUnit,
      quantity,
      baselineTotal,
      negotiatedTotal,
      differenceUnit,
      savingsTotal,
      savingsPercent,
      outcome: savingsTotal > 0 ? "saving" : savingsTotal < 0 ? "increase" : "neutral"
    };
  }

  return Object.freeze({ parseBrazilianNumber, calculateSavings });
});
