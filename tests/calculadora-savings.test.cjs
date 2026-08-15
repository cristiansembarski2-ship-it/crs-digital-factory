const test = require("node:test");
const assert = require("node:assert/strict");
const { parseBrazilianNumber, calculateSavings } = require("../calculadora-savings/calculator-core.js");

test("interpreta formatos monetários brasileiros e simples", () => {
  assert.equal(parseBrazilianNumber("R$ 1.250,50"), 1250.5);
  assert.equal(parseBrazilianNumber("50,00"), 50);
  assert.equal(parseBrazilianNumber("50.00"), 50);
  assert.equal(parseBrazilianNumber("1.200"), 1200);
});

test("calcula saving positivo e percentual", () => {
  const result = calculateSavings({ baselineUnit: "50,00", negotiatedUnit: "46,00", quantity: "1200" });
  assert.equal(result.ok, true);
  assert.equal(result.baselineTotal, 60000);
  assert.equal(result.negotiatedTotal, 55200);
  assert.equal(result.savingsTotal, 4800);
  assert.equal(result.savingsPercent, 8);
  assert.equal(result.outcome, "saving");
});

test("identifica aumento e cenário neutro", () => {
  const increase = calculateSavings({ baselineUnit: 10, negotiatedUnit: 12, quantity: 5 });
  assert.equal(increase.savingsTotal, -10);
  assert.equal(increase.outcome, "increase");

  const neutral = calculateSavings({ baselineUnit: 10, negotiatedUnit: 10, quantity: 5 });
  assert.equal(neutral.savingsTotal, 0);
  assert.equal(neutral.outcome, "neutral");
});

test("rejeita campos inválidos sem produzir resultado enganoso", () => {
  const result = calculateSavings({ baselineUnit: "", negotiatedUnit: "-1", quantity: "0" });
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ["baselineUnit", "negotiatedUnit", "quantity"]);
});

test("baseline zero não gera divisão inválida", () => {
  const result = calculateSavings({ baselineUnit: 0, negotiatedUnit: 5, quantity: 2 });
  assert.equal(result.ok, true);
  assert.equal(result.savingsPercent, null);
  assert.equal(result.outcome, "increase");
});
