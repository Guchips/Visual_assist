
const NativeWebSocket = window.WebSocket;

class CustomWebSocket extends NativeWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    let targetUrl = url instanceof URL ? url.toString() : url;
    
    // Перехватываем запросы к API Google
    if (targetUrl.includes('generativelanguage.googleapis.com')) {
      console.log('🚀 [Proxy] Перехват запроса к Google:', targetUrl);
      // Подменяем хост на прокси
      targetUrl = targetUrl.replace('generativelanguage.googleapis.com', 'ws.kazbon.kz');
    }
    
    super(targetUrl, protocols);
  }
}

// Восстанавливаем статические свойства (CONNECTING, OPEN, и т.д.)
['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach((prop) => {
    // Копируем свойства через геттер, чтобы сохранить оригинальные значения
    Object.defineProperty(CustomWebSocket, prop, {
        get: () => (NativeWebSocket as any)[prop],
        enumerable: true,
        configurable: true
    });
});

// Функция для безопасного переопределения WebSocket
const patchWebSocket = (target: any) => {
    try {
        Object.defineProperty(target, 'WebSocket', {
            value: CustomWebSocket,
            configurable: true,
            writable: true
        });
    } catch (e) {
        console.error('[Proxy] Failed to patch WebSocket on target:', e);
    }
};

// Применяем патч к window
patchWebSocket(window);

// Применяем патч к globalThis (для совместимости с некоторыми средами)
if (typeof globalThis !== 'undefined') {
    patchWebSocket(globalThis);
}

export {};
