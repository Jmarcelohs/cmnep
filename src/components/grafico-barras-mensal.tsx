const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const LARGURA = 700;
const ALTURA = 280;
const MARGEM_BASE = { topo: 36, direita: 16, baixo: 28, esquerda: 40 };
const ALTURA_GRAFICO = ALTURA - MARGEM_BASE.topo - MARGEM_BASE.baixo;
const ESPACO_ENTRE_BARRAS = 2;
const LARGURA_MAX_BARRA = 24;
// Largura média de caractere a fontSize 10 (estimativa, sem medição real de
// texto disponível em componente server-only) — margem esquerda cresce com o
// rótulo mais largo do eixo Y pra não cortar "R$ 15.000,00" etc. contra a
// borda esquerda do viewBox.
const LARGURA_MEDIA_CARACTERE = 5.5;

// Arredonda pra um número "redondo" (1/2/5 × 10ⁿ) pra servir de teto do
// eixo Y — evita gridlines em valores tipo "R$ 3.217,40".
function numeroAgradavel(valor: number): number {
  if (valor <= 0) return 1;
  const exponente = Math.floor(Math.log10(valor));
  const base = 10 ** exponente;
  const fracao = valor / base;
  const fracaoAgradavel = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10;
  return fracaoAgradavel * base;
}

export type SerieGrafico = {
  rotulo: string;
  cor: string;
  valores: number[]; // 12 posições, jan–dez
};

export function GraficoBarrasMensal({
  titulo,
  series,
  formatarValor = (valor) => String(valor),
}: {
  titulo: string;
  series: SerieGrafico[];
  formatarValor?: (valor: number) => string;
}) {
  const maiorValor = Math.max(0, ...series.flatMap((s) => s.valores));
  const maximoEixo = numeroAgradavel(maiorValor);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maximoEixo * f));

  const larguraMaiorRotulo = Math.max(...ticks.map((t) => formatarValor(t).length)) * LARGURA_MEDIA_CARACTERE;
  const MARGEM = { ...MARGEM_BASE, esquerda: Math.max(MARGEM_BASE.esquerda, larguraMaiorRotulo + 16) };
  const LARGURA_GRAFICO = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const LARGURA_GRUPO = LARGURA_GRAFICO / 12;

  const qtdBarras = series.length;
  const larguraUtilGrupo = LARGURA_GRUPO - 8; // 4px de respiro de cada lado do grupo
  const larguraBarra = Math.min(
    LARGURA_MAX_BARRA,
    (larguraUtilGrupo - ESPACO_ENTRE_BARRAS * (qtdBarras - 1)) / qtdBarras,
  );
  const larguraConteudoGrupo = larguraBarra * qtdBarras + ESPACO_ENTRE_BARRAS * (qtdBarras - 1);

  return (
    <div>
      <p className="text-sm font-semibold text-brand-navy">{titulo}</p>

      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-600">
          {series.map((s) => (
            <span key={s.rotulo} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.cor }} />
              {s.rotulo}
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="mt-2 w-full" role="img" aria-label={titulo}>
        {ticks.map((tick) => {
          const y = MARGEM.topo + ALTURA_GRAFICO * (1 - tick / (maximoEixo || 1));
          return (
            <g key={tick}>
              <line
                x1={MARGEM.esquerda}
                x2={LARGURA - MARGEM.direita}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text x={MARGEM.esquerda - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#64748b">
                {formatarValor(tick)}
              </text>
            </g>
          );
        })}

        {MESES.map((mes, indiceMes) => {
          const xGrupo = MARGEM.esquerda + indiceMes * LARGURA_GRUPO + (LARGURA_GRUPO - larguraConteudoGrupo) / 2;
          return (
            <g key={mes}>
              <text
                x={MARGEM.esquerda + indiceMes * LARGURA_GRUPO + LARGURA_GRUPO / 2}
                y={ALTURA - MARGEM.baixo + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#64748b"
              >
                {mes}
              </text>
              {series.map((serie, indiceSerie) => {
                const valor = serie.valores[indiceMes] ?? 0;
                const alturaBarra = maximoEixo > 0 ? (valor / maximoEixo) * ALTURA_GRAFICO : 0;
                const xBarra = xGrupo + indiceSerie * (larguraBarra + ESPACO_ENTRE_BARRAS);
                const yBarra = MARGEM.topo + ALTURA_GRAFICO - alturaBarra;
                return (
                  <g key={serie.rotulo}>
                    <title>
                      {mes} — {serie.rotulo}: {formatarValor(valor)}
                    </title>
                    {alturaBarra > 0 && (
                      <>
                        <rect x={xBarra} y={yBarra} width={larguraBarra} height={alturaBarra} rx={4} ry={4} fill={serie.cor} />
                        {alturaBarra > 4 && (
                          <rect x={xBarra} y={yBarra + alturaBarra - 4} width={larguraBarra} height={4} fill={serie.cor} />
                        )}
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-slate-500">Mês</th>
              {series.map((s) => (
                <th key={s.rotulo} className="px-2 py-1 text-right font-medium text-slate-500">
                  {s.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MESES.map((mes, indiceMes) => (
              <tr key={mes}>
                <td className="px-2 py-1 text-slate-700">{mes}</td>
                {series.map((s) => (
                  <td key={s.rotulo} className="px-2 py-1 text-right text-slate-700">
                    {formatarValor(s.valores[indiceMes] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
