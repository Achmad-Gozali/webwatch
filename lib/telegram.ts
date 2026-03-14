// PATH: lib/telegram.ts
// Helper untuk kirim notifikasi ke Telegram

const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[WebWatch] TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID tidak ditemukan.');
    return;
  }

  try {
    await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('[WebWatch] Gagal kirim notifikasi Telegram:', error);
  }
}

export function alertOffline(siteName: string, url: string): string {
  const time = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return `🔴 <b>OFFLINE ALERT</b>\n\nWebsite: <b>${siteName}</b>\nURL: ${url}\nWaktu: ${time}\n\n<i>WebWatch sedang memantau situasi ini.</i>`;
}

export function alertDegraded(siteName: string, url: string, responseTime: number): string {
  const time = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return `🟡 <b>DEGRADED ALERT</b>\n\nWebsite: <b>${siteName}</b>\nURL: ${url}\nResponse time: <b>${responseTime}ms</b>\nWaktu: ${time}`;
}

export function alertRecovery(siteName: string, url: string, durationMinutes: number): string {
  const time = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return `🟢 <b>RECOVERY</b>\n\nWebsite: <b>${siteName}</b>\nURL: ${url}\nKembali online setelah <b>${durationMinutes} menit</b>\nWaktu: ${time}`;
}

export function alertSlowResponse(siteName: string, url: string, responseTime: number): string {
  return `⚠️ <b>SLOW RESPONSE</b>\n\nWebsite: <b>${siteName}</b>\nURL: ${url}\nResponse time: <b>${responseTime}ms</b> (terlalu lambat)`;
}