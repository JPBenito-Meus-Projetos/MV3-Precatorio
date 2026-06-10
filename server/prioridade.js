/** Critérios de priorização interna — ajuste conforme a estratégia da MNPR */

export const PERFIS = {
  empresa: { label: "Empresa", pontos: 30 },
  advogado: { label: "Advogado / Escritório", pontos: 25 },
  servidor_publico: { label: "Servidor público", pontos: 15 },
  pessoa_fisica: { label: "Pessoa física", pontos: 10 },
  outro: { label: "Outro", pontos: 5 },
};

export const PERFIS_VALIDOS = Object.keys(PERFIS);

/** Valores em centavos (ex.: 10_000_000 = R$ 100.000,00) */
const FAIXAS_VALOR = [
  { minCentavos: 50_000_000, pontos: 40, label: "Elevado (≥ R$ 500 mil)" },
  { minCentavos: 10_000_000, pontos: 25, label: "Alto (≥ R$ 100 mil)" },
  { minCentavos: 3_000_000, pontos: 10, label: "Médio (≥ R$ 30 mil)" },
  { minCentavos: 0, pontos: 0, label: "Abaixo do perfil prioritário" },
];

const NIVEIS = [
  { minScore: 50, nivel: "alta", label: "Alta prioridade", subjectTag: "[ALTA PRIORIDADE] " },
  { minScore: 25, nivel: "media", label: "Média prioridade", subjectTag: "[MÉDIA PRIORIDADE] " },
  { minScore: 0, nivel: "baixa", label: "Baixa prioridade", subjectTag: "[BAIXA PRIORIDADE] " },
];

export function avaliarPrioridade(perfil, valorDigits, perfilCustomizado = "") {
  const perfilInfo = PERFIS[perfil] ?? PERFIS.outro;
  const valorCentavos = Number(valorDigits) || 0;
  const perfilLabel =
    perfil === "outro" && perfilCustomizado
      ? `Outro — ${perfilCustomizado}`
      : perfilInfo.label;

  const faixaValor = FAIXAS_VALOR.find((f) => valorCentavos >= f.minCentavos) ?? FAIXAS_VALOR.at(-1);
  const score = perfilInfo.pontos + faixaValor.pontos;
  const nivelInfo = NIVEIS.find((n) => score >= n.minScore) ?? NIVEIS.at(-1);

  return {
    nivel: nivelInfo.nivel,
    label: nivelInfo.label,
    score,
    subjectTag: nivelInfo.subjectTag,
    perfilLabel,
    motivos: [
      `Perfil "${perfilLabel}" (+${perfilInfo.pontos} pts)`,
      `Valor ${faixaValor.label} (+${faixaValor.pontos} pts)`,
    ],
  };
}
