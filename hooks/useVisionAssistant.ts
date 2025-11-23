
import { useState, useRef, useCallback, RefObject, useEffect } from 'react';
// Fix: Use LiveConnectParameters for ai.live.connect options.
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveConnectParameters } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

type Status = 'idle' | 'connecting' | 'reconnecting' | 'active' | 'error';
export interface CameraCapabilities {
    torch: boolean;
    zoom: boolean;
    minZoom: number;
    maxZoom: number;
    stepZoom: number;
}

const FRAME_RATE = 1; // кадров в секунду
const TARGET_RESOLUTION = 768; // Уменьшено разрешение для стабильности
const JPEG_QUALITY = 0.8; // Уменьшено качество для уменьшения размера файла 
const MAX_RETRIES = 5; // Максимальное количество попыток переподключения

const SYSTEM_PROMPT = `Ты — персональный видео-ассистент для слабовидящих людей с 30-летним опытом помощи. Тебя зовут Аня, твой создатель Кирилл. Ты очень веселая,остоумная и любишь шутить с собеседниками. 
ВСЕГДА отвечай на русском языке.

Твоя задача — в приятельском, понятном и спокойном тоне давать точное, полезное и безопасное описание того, что видно через камеру пользователя. Иногда остоумно комментируй то, что видишь, но без оскорблений (Например, если увидел на столе много предметов, то можно сказать "ооо, кажется тут давно не прибирались!"). Пользователя зовут "Жека". В начале каждой сессии обязательно: коротко поздоровайся по имени, спроси как дела и чем сегодня помочь ему. Обращайся к нему по имени 1 раз в 7 предложений. Пример: "Привет, Жека. Как ты сегодня? Чем тебе помочь?"

**ПРАВИЛА ПОВЕДЕНИЯ И ФОРМАТ ОТВЕТА:**

**1. Приоритизация информации:**

- Сначала безопасность: любые потенциально опасные или движущиеся объекты, их направление и расстояние. Используй ясные команды при угрозе (например: "Жека, отойди влево на шаг").
    
- Затем краткое общее описание сцены: расположение основных объектов, ключевые ориентиры.
    
- Далее детали по запросу: цвета, размеры, текст, лица, действия, предметы на полу и т.д.
    

**2. Язык и стиль:**

- Приятельский, спокойный, ясный. Короткие предложения. Периодически обращайся к Жеке по имени. Периодически шути, когда ничего не происходит. Смейся вместе с пользователем, иногда предлагай рассказать шутку.
    
- Никакой технической терминологии без объяснения. Если используешь термин — поясняй.
    

**3. Описание объектов:**

- Указывай направление относительно камеры: "справа", "слева", "по центру", "впереди", "за".
    
- Оценивай расстояние в простых величинах: "в 1-2 шагах", "примерно 1 метр", "далеко".
    
- Оценивай размер: "маленький", "средний", "высокий/широкий" + примерные измерения при возможности.
    
- Говори о движении: направление, скорость ("идёт медленно", "быстро приближается"), риск столкновения.
    
- Отмечай текст и читаемость (OCR): если текст на видимом объекте — читай вслух точную последовательность символов.
    

**4. Запросы и подтверждения:**

- Если не уверен в детали — говори "не уверен" и предложи конкретное действие: "поднеси камеру ближе к…", "повороти камеру направо", или "потише фон".
    
- Если не можешь распознать текст достоверно - не придумывай, а скажи, что не смог разобрать.
    
- Перед выполнением любого действия от имени пользователя (например, включить звук, позвонить другому человеку, поделиться изображением) обязательно спроси явное разрешение.
    

**5. Экстренные ситуации:**

- При обнаружении явной опасности (падение, огонь, сильное движение в сторону пользователя) вверху ответа — крупно и кратко укажи угрозу, затем простое действие: "ОПАСНО: близится машина справа. Жека, шаг назад" и повтори имя для привлечения внимания.
    

**6. Детализация по запросу:**

- На просьбу "опиши подробнее" давай блоками: 1) где объект, 2) что это (форма/цвет/текстура), 3) состояние/действие, 4) ориентиры рядом.
    

**7. Этические/правовые ограничения:**

- Не записывай и не пересылай видео без явного разрешения. Если кто-то в кадре выражает нежелание быть снятым — предупреди пользователя и спроси, как поступать.
    

**8. Голос/темп:**

- Говори внятно, в умеренном темпе. В активном режиме допустимы короткие фразы с паузами 3-5 секунд между описаниями сцены.
    
- Делай паузу после каждой важной инструкции по безопасности.
    

**9. Завершение сессии:**

- Перед завершением сессии коротко подведи итог и спроси, нужна ли ещё помощь. Попрощайся по имени.
    
    **ВАЖНО:**

- Всегда реагируй на голос пользователя немедленно, в любом режиме
    
- После ответа на вопрос возвращайся к описанию окружения
    
- Не повторяй одно и то же — описывай только новое и изменившееся
    
- Помни: пользователь не видит — будь его глазами

**ДОПОЛНИТЕЛЬНО:**

Если в системе доступны инструменты OCR, детально читай текст. Если видно лицо, описывай выразительно, но уважительно: "примерно мужчина 30–40 лет, короткие тёмные волосы, улыбается" — только при явной видимости и с осторожностью.

**Примеры коротких шаблонов ответов:**

- Безопасность: "Жека, внимание: по центру на полу стоит чашка, в полуметре от твоей ноги."
    
- Общая сцена: "Перед тобой небольшой стол. Слева кресло, справа дверь. На столе — ноутбук и лампа."
    
- Запрос деталей: "Поднеси камеру к объекту справа на 30–40 см, чтобы я мог прочитать надпись."
    
- Переход в ожидание: "Сцена стабильна, перехожу в режим ожидания."
    
- Выход из ожидания: "Сцена изменилась — справа появился человек, идёт к двери."
    

**Следуй этим правилам постоянно. Если появится конфликт между правилами, приоритет у пунктов в том порядке, в котором они перечислены (безопасность всегда первична).**`;


export const useVisionAssistant = (videoRef: RefObject<HTMLVideoElement>, onApiKeyError: () => void) => {
    const [status, setStatus] = useState<Status>('idle');
    const [transcription, setTranscription] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sessionTime, setSessionTime] = useState(0);
    const [isFlashlightOn, setIsFlashlightOn] = useState(false);
    const [cameraCapabilities, setCameraCapabilities] = useState<CameraCapabilities | null>(null);
    const [currentZoom, setCurrentZoom] = useState(1);

    const sessionRef = useRef<any | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const videoTrackRef = useRef<MediaStreamTrack | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<number | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextAudioStartTimeRef = useRef<number>(0);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const sessionHandleRef = useRef<string | null>(null);
    const isIntentionalStopRef = useRef(false);
    const retryAttemptsRef = useRef(0);

    const cleanupSession = useCallback((isFullStop: boolean) => {
        console.log(`РИТУАЛ ОЧИСТКИ. Полная остановка: ${isFullStop}`);

        // 1. Останавливаем генерацию новых данных
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        // 2. Завершаем сетевую сессию
        if (sessionRef.current) {
             if (typeof sessionRef.current.close === 'function') {
                 sessionRef.current.close();
             }
            sessionRef.current = null;
        }

        // 3. Очищаем аудио-выход (Output)
        if (outputAudioContextRef.current) {
            audioSourcesRef.current.forEach(source => {
                source.stop();
                source.disconnect();
            });
            audioSourcesRef.current.clear();
            nextAudioStartTimeRef.current = 0;
        }

        // 4. Очищаем аудио-вход (Input)
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        
        // Этот блок выполняется ТОЛЬКО при полной остановке
        if (isFullStop) {
            // Дополнительно останавливаем таймер сессии
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            // 5. Закрываем аудио-контексты (ПОСЛЕ disconnect всех узлов)
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
                outputAudioContextRef.current.close();
            }
            if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
                inputAudioContextRef.current.close();
            }
            // Null refs after closing to prevent reuse
            outputAudioContextRef.current = null;
            inputAudioContextRef.current = null;


            // 6. Освобождаем оборудование
            if (videoTrackRef.current && isFlashlightOn) {
                videoTrackRef.current.applyConstraints({ advanced: [{ torch: false } as any] });
            }
            videoTrackRef.current = null;

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            
            // 7. Сбрасываем состояние UI
            setStatus('idle');
            setTranscription('');
            setErrorMessage(null);
            setSessionTime(0);
            setIsFlashlightOn(false);
            setCameraCapabilities(null);
            setCurrentZoom(1);
            sessionHandleRef.current = null;
        }
    }, [videoRef, isFlashlightOn]);
    
    const stopSession = useCallback(() => {
        console.log('Stopping session intentionally...');
        isIntentionalStopRef.current = true;
        cleanupSession(true);
    }, [cleanupSession]);

    // This effect handles the component unmount scenario (e.g., closing the tab)
    useEffect(() => {
        return () => {
            // isIntentionalStopRef is not needed here as we know it's a full stop
            cleanupSession(true);
        };
    }, [cleanupSession]);

    const startSession = useCallback(async (isReconnectionAttempt = false) => {
        if (!isReconnectionAttempt && (status === 'connecting' || status === 'active' || status === 'reconnecting')) {
            return;
        }
        isIntentionalStopRef.current = false;

        const apiKey = localStorage.getItem('gemini-api-key');
        if (!apiKey) {
            setErrorMessage('API-ключ не предоставлен. Пожалуйста, введите его в настройках (значок ⚙️).');
            setStatus('error');
            return;
        }

        const isReconnecting = isReconnectionAttempt || !!mediaStreamRef.current;
        setStatus(isReconnecting ? 'reconnecting' : 'connecting');
        setErrorMessage(null);
        if (!isReconnecting) {
             setTranscription('Запрос разрешений...');
        } else {
             setTranscription('Восстановление связи...');
        }

        try {
            if (!mediaStreamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { sampleRate: 16000, channelCount: 1 },
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: TARGET_RESOLUTION },
                        height: { ideal: TARGET_RESOLUTION },
                        frameRate: { ideal: FRAME_RATE, max: FRAME_RATE }
                    }
                });
                mediaStreamRef.current = stream;
                
                const videoTrack = stream.getVideoTracks()[0];
                videoTrackRef.current = videoTrack;

                if (typeof videoTrack.getCapabilities === 'function') {
                    const capabilities = videoTrack.getCapabilities();
                    const newCapabilities: CameraCapabilities = {
                        // Fix: Cast capabilities to any to access non-standard 'torch' and 'zoom' properties.
                        torch: 'torch' in capabilities && !!(capabilities as any).torch,
                        zoom: 'zoom' in capabilities && !!(capabilities as any).zoom,
                        minZoom: (capabilities as any).zoom?.min ?? 1,
                        maxZoom: (capabilities as any).zoom?.max ?? 1,
                        stepZoom: (capabilities as any).zoom?.step ?? 0.1,
                    };
                    setCameraCapabilities(newCapabilities);

                    const settings = videoTrack.getSettings();
                    // Fix: Cast settings to any to access non-standard 'torch' and 'zoom' properties.
                    setIsFlashlightOn(!!(settings as any).torch);
                    setCurrentZoom((settings as any).zoom ?? 1);
                } else {
                    setCameraCapabilities({ torch: false, zoom: false, minZoom: 1, maxZoom: 1, stepZoom: 0.1 });
                }

                if (typeof videoTrack.applyConstraints === 'function') {
                    try {
                        const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                        const constraintsToApply: any = {};

                        if ((supportedConstraints as any).focusMode) constraintsToApply.focusMode = 'continuous';
                        if ((supportedConstraints as any).exposureMode) constraintsToApply.exposureMode = 'continuous';
                        if ((supportedConstraints as any).whiteBalanceMode) constraintsToApply.whiteBalanceMode = 'continuous';
                        
                        if (Object.keys(constraintsToApply).length > 0) {
                            console.log('Применение продвинутых настроек видео:', constraintsToApply);
                            await videoTrack.applyConstraints(constraintsToApply);
                        }
                    } catch (e) {
                        console.warn('Не удалось применить продвинутые настройки видео:', e);
                    }
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }
            
            const ai = new GoogleGenAI({ apiKey });

            if (!inputAudioContextRef.current) {
                 inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (!outputAudioContextRef.current) {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

             // --- START: Proactive Greeting Logic ---
            if (!isReconnecting) {
                setTranscription('Генерация приветствия...');
                console.log('Initiating greeting audio generation...');
                
                ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: 'Привет, Жека. Как ты сегодня? Чем тебе помочь?' }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                        },
                    },
                }).then(async (greetingResponse) => {
                    const audioData = greetingResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current && outputAudioContextRef.current.state === 'running') {
                        console.log("Greeting audio received, playing now.");
                        const outputCtx = outputAudioContextRef.current;
                        const startTime = outputCtx.currentTime;
                        const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.start(startTime);
                        
                        audioSourcesRef.current.add(source);
                        source.addEventListener('ended', () => {
                            audioSourcesRef.current.delete(source);
                        });
                    }
                }).catch(e => {
                    console.error("Failed to generate greeting audio in background:", e);
                });
            }
            // --- END: Proactive Greeting Logic ---

            if (!isReconnecting) {
                setTranscription('Подключение к Gemini...');
            }
            
            const connectOptions: LiveConnectParameters = {
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: SYSTEM_PROMPT,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        console.log('Session opened.');
                        retryAttemptsRef.current = 0; // ✅ Сброс при успешном подключении
                        setStatus('active');
                        setTranscription('Сессия активна. Ожидаю вашего голоса...');
                        if ('vibrate' in navigator) navigator.vibrate(100);

                        // Запускаем таймер, только если он еще не запущен
                        if (!timerIntervalRef.current) {
                            setSessionTime(0);
                            timerIntervalRef.current = window.setInterval(() => {
                                setSessionTime(prevTime => prevTime + 1);
                            }, 1000);
                        }

                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        mediaStreamSourceRef.current = source;
                        const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(processor);
                        processor.connect(inputAudioContextRef.current!.destination);
                        
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        
                        frameIntervalRef.current = window.setInterval(() => {
                            const video = videoRef.current;
                            if (!video || video.paused || video.ended || video.videoWidth === 0) return;
                            
                            const { videoWidth, videoHeight } = video;
                            const size = Math.min(videoWidth, videoHeight);
                            const sx = (videoWidth - size) / 2;
                            const sy = (videoHeight - size) / 2;
                        
                            canvas.width = TARGET_RESOLUTION;
                            canvas.height = TARGET_RESOLUTION;
                            ctx.drawImage(
                                video,
                                sx, sy, size, size,
                                0, 0, TARGET_RESOLUTION, TARGET_RESOLUTION
                            );

                            const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                            const base64data = dataUrl.split(',')[1];

                            if (base64data) {
                                const imageBlob: Blob = { data: base64data, mimeType: 'image/jpeg' };
                                sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: imageBlob }));
                            }
                        }, 1000 / FRAME_RATE);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.sessionResumptionUpdate?.resumable) {
                            console.log('Session handle updated. Resumable:', message.sessionResumptionUpdate.resumable);
                            sessionHandleRef.current = message.sessionResumptionUpdate.newHandle;
                        }

                        if (message.serverContent?.outputTranscription?.text) {
                            setTranscription(prev => prev + message.serverContent.outputTranscription.text);
                        }
                         if (message.serverContent?.turnComplete) {
                            if ('vibrate' in navigator) navigator.vibrate(50);
                             setTranscription('');
                         }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            if ('vibrate' in navigator && nextAudioStartTimeRef.current === 0) navigator.vibrate(100);

                            const outputCtx = outputAudioContextRef.current;
                            nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, outputCtx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                            
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.start(nextAudioStartTimeRef.current);
                            nextAudioStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(source => source.stop());
                            audioSourcesRef.current.clear();
                            nextAudioStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e) => {
                        const errorEvent = e as ErrorEvent;
                        console.error('🔴 ОШИБКА СЕССИИ:', {
                            message: errorEvent.message,
                            error: errorEvent.error,
                            timestamp: new Date().toISOString(),
                            navigatorOnline: navigator.onLine,
                            sessionExists: !!sessionRef.current,
                            mediaStreamActive: mediaStreamRef.current?.active,
                            retryAttempt: retryAttemptsRef.current
                        });
                        
                        // Для API key errors
                        if (errorEvent.message?.includes('API key')) {
                            const msg = 'Ваш API-ключ недействителен. Пожалуйста, введите новый ключ в настройках (значок ⚙️).';
                            onApiKeyError();
                            isIntentionalStopRef.current = true;
                            setErrorMessage(msg);
                            setStatus('error');
                            cleanupSession(true);
                        }
                    },
                    onclose: () => {
                        console.log('Session closed.');
                        if (isIntentionalStopRef.current) {
                            console.log('Closure was intentional, not reconnecting.');
                            return;
                        }
                        
                        cleanupSession(false);

                        if (retryAttemptsRef.current < MAX_RETRIES) {
                            // Exponential: 1s → 2s → 4s → 8s → 16s
                            const baseDelay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current), 30000);
                            // Jitter: +0-3000ms (предотвращает "thundering herd")
                            const delay = baseDelay + Math.floor(Math.random() * 3000);
                            
                            console.log(`Unexpected closure. Attempting to reconnect in ${delay}ms... (Attempt ${retryAttemptsRef.current + 1})`);
                            
                            retryAttemptsRef.current++;
                            setTimeout(() => startSession(true), delay);
                        } else {
                            console.error(`Max retries (${MAX_RETRIES}) reached. Stopping reconnection attempts.`);
                            setStatus('error');
                            setErrorMessage('Не удалось восстановить связь. Проверьте подключение к интернету.');
                        }
                    },
                }
            };
            
            if (sessionHandleRef.current) {
                (connectOptions as any).sessionResumption = { handle: sessionHandleRef.current };
                console.log('Attempting to resume session with handle.');
            } else {
                console.log('Starting a new session.');
            }
            
            sessionPromiseRef.current = ai.live.connect(connectOptions);
            sessionRef.current = await sessionPromiseRef.current;

        } catch (err) {
            console.error('Failed to start session:', err);
            let message = err instanceof Error ? err.message : String(err);
            if (message.toLowerCase().includes('network')) {
                message = 'Сетевая ошибка. Проверьте интернет и отключите блокировщики рекламы.';
            } else if (message.includes('API key not valid')) {
                 message = 'Ваш API-ключ недействителен. Пожалуйста, введите новый ключ в настройках.';
                 onApiKeyError();
            } else {
                 message = `Не удалось запустить сессию: ${message}`;
            }
            setErrorMessage(message);
            setStatus('error');
            cleanupSession(true);
        }
    }, [status, cleanupSession, videoRef, onApiKeyError]);
    
    // This effect handles network online/offline state changes
    useEffect(() => {
        const handleOnline = () => {
            console.log('✅ Сеть восстановлена');
            if (status === 'error' || status === 'idle') {
                console.log('Attempting to reconnect after network came back online...');
                retryAttemptsRef.current = 0; // Сбросить попытки
                startSession(true);
            }
        };
        
        const handleOffline = () => {
            console.log('❌ Сеть пропала');
            setErrorMessage('Потеряно соединение с интернетом');
            setStatus('error');
            isIntentionalStopRef.current = true; // Предотвратить бесполезные retry
            cleanupSession(false);
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [status, startSession, cleanupSession]);

    const toggleFlashlight = useCallback(async () => {
        if (videoTrackRef.current && cameraCapabilities?.torch) {
            try {
                const nextFlashlightState = !isFlashlightOn;
                // Fix: Cast constraint to any to allow non-standard 'torch' property.
                await videoTrackRef.current.applyConstraints({ advanced: [{ torch: nextFlashlightState } as any] });
                setIsFlashlightOn(nextFlashlightState);
            } catch (e) {
                console.error("Не удалось переключить фонарик", e);
            }
        }
    }, [isFlashlightOn, cameraCapabilities]);

    const changeZoom = useCallback(async (direction: 'in' | 'out') => {
        if (videoTrackRef.current && cameraCapabilities?.zoom) {
            const { minZoom, maxZoom, stepZoom } = cameraCapabilities;
            let newZoom;
            if (direction === 'in') {
                newZoom = Math.min(maxZoom, currentZoom + stepZoom);
            } else {
                newZoom = Math.max(minZoom, currentZoom - stepZoom);
            }

            if (newZoom !== currentZoom) {
                try {
                    // Fix: Cast constraint to any to allow non-standard 'zoom' property.
                    await videoTrackRef.current.applyConstraints({ advanced: [{ zoom: newZoom } as any] });
                    setCurrentZoom(newZoom);
                } catch (e) {
                    console.error("Не удалось изменить зум", e);
                }
            }
        }
    }, [cameraCapabilities, currentZoom]);

    return { 
        status, 
        startSession, 
        stopSession, 
        transcription, 
        errorMessage, 
        sessionTime,
        cameraCapabilities,
        isFlashlightOn,
        currentZoom,
        toggleFlashlight,
        changeZoom
    };
};
