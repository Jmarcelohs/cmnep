// Nunito (OFL, licença livre) — substituto da fonte real do documento de
// Congratulação (Maiandra GD), que é uma fonte comercial da Monotype
// licenciada junto com o Windows/Office. Embutir o arquivo real geraria
// redistribuição pública dele via este site, o que pode violar a licença
// — ver mocao-conteudo.tsx para a decisão completa.
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-slate-200 py-8 print:bg-white print:py-0">{children}</div>;
}
