// Splash screen mostrado pelo iOS enquanto o app (aberto pela tela inicial)
// carrega — sem isso aparece uma tela branca "seca" por um instante. O iOS
// não aceita um ícone único escalável pra isso: precisa de um <link> por
// combinação de tamanho de tela/orientação. `device-width`/`device-height`
// são sempre os valores em modo retrato do aparelho (não invertem com a
// orientação); só o `orientation` muda.
const DEVICES = [
  { w: 375, h: 667, dpr: 2 }, // SE 2ª/3ª geração, 6/7/8
  { w: 414, h: 896, dpr: 2 }, // 11, XR
  { w: 375, h: 812, dpr: 3 }, // X/XS/11 Pro, 12 mini/13 mini
  { w: 390, h: 844, dpr: 3 }, // 12/13/14, 15/16
  { w: 393, h: 852, dpr: 3 }, // 12/13/14 Pro, 15/16 Pro
  { w: 428, h: 926, dpr: 3 }, // 11 Pro Max, 12/13/14 Plus/Pro Max
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15/16 Pro Max/Plus
];

export function AppleSplashLinks() {
  return (
    <>
      {DEVICES.flatMap((d) => {
        const portraitPx = `${d.w * d.dpr}x${d.h * d.dpr}`;
        const landscapePx = `${d.h * d.dpr}x${d.w * d.dpr}`;
        return [
          <link
            key={`${d.w}x${d.h}-portrait`}
            rel="apple-touch-startup-image"
            href={`/splash/splash-${portraitPx}.png`}
            media={`(device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)`}
          />,
          <link
            key={`${d.w}x${d.h}-landscape`}
            rel="apple-touch-startup-image"
            href={`/splash/splash-${landscapePx}.png`}
            media={`(device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: landscape)`}
          />,
        ];
      })}
    </>
  );
}
