import sharp from "sharp";

// docx-js exige um Buffer + tipo explícito de imagem — normaliza pra PNG
// via sharp independente do formato de origem, evitando ter que detectar
// o formato real de cada arquivo (logo, assinaturas, etc.).
export async function paraPng(origem: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const data = await sharp(origem).png().toBuffer();
  const meta = await sharp(data).metadata();
  return { data, width: meta.width ?? 1, height: meta.height ?? 1 };
}

export function escalar(
  largura: number,
  altura: number,
  larguraAlvo: number,
  alturaMax: number,
): { width: number; height: number } {
  let w = larguraAlvo;
  let h = (altura / largura) * w;
  if (h > alturaMax) {
    h = alturaMax;
    w = (largura / altura) * h;
  }
  return { width: Math.round(w), height: Math.round(h) };
}
