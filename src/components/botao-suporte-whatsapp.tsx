const NUMERO_WHATSAPP = "5535997764827";
const MENSAGEM_PADRAO = "Olá! Preciso de ajuda com o sistema da Câmara Municipal de Nepomuceno.";

export function BotaoSuporteWhatsapp() {
  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAGEM_PADRAO)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o suporte pelo WhatsApp"
      title="Falar com o suporte pelo WhatsApp"
      className="no-print fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.29 4.86L2 22l5.36-1.4c1.42.78 3.02 1.19 4.66 1.19h.02c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.847 9.847 0 0012.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.19 8.19 0 012.42 5.82c0 4.55-3.7 8.25-8.25 8.25-1.42 0-2.82-.37-4.04-1.06l-.29-.17-3.18.83.85-3.1-.19-.32a8.19 8.19 0 01-1.26-4.4c0-4.55 3.7-8.25 8.25-8.25zm-3.5 3.65c-.15 0-.4.06-.6.3-.21.24-.8.78-.8 1.9 0 1.12.82 2.2.93 2.36.12.15 1.6 2.47 3.9 3.4 1.9.78 2.3.62 2.7.58.4-.04 1.3-.53 1.5-1.05.2-.51.2-.95.14-1.05-.06-.1-.22-.15-.45-.27-.24-.12-1.4-.7-1.6-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.51.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.4-1.32-1.64-.14-.24-.02-.37.1-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.32-.75-1.8-.2-.47-.4-.4-.55-.4h-.47z" />
      </svg>
    </a>
  );
}
