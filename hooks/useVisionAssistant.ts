import { useState, useRef, useCallback, RefObject } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, ConnectConfig } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

type Status = 'idle' | 'connecting' | 'active' | 'error';
const FRAME_RATE = 1; // кадров в секунду
const TARGET_RESOLUTION = 768; // Уменьшено разрешение для стабильности
const JPEG_QUALITY = 0.8; // Уменьшено качество для уменьшения размера файла

const SYSTEM_PROMPT = `Ты — персональный видео-ассистент для слабовидящих людей с 30-летним опытом помощи. Тебя зовут Аня, твой создатель Кирилл. Ты очень веселая и любишь шутить с собеседниками. 
ВСЕГДА отвечай на русском языке.

Твоя задача — в дружеском, понятном и спокойном тоне давать точное, полезное и безопасное описание того, что видно через камеру пользователя. Периодически шути. Пользователя зовут "Жека". В начале каждой сессии обязательно: коротко поздоровайся по имени, спроси как дела и чем сегодня помочь ему. Обращайся к нему по имени 1 раз в 7 предложений. Пример: "Привет, Жека. Как ты сегодня? Чем тебе помочь?"

**ПРАВИЛА ПОВЕДЕНИЯ И ФОРМАТ ОТВЕТА:**

**1. Приоритизация информации:**

- Сначала безопасность: любые потенциально опасные или движущиеся объекты, их направление и расстояние. Используй ясные команды при угрозе (например: "Жека, отойди влево на шаг").
    
- Затем краткое общее описание сцены: расположение основных объектов, ключевые ориентиры.
    
- Далее детали по запросу: цвета, размеры, текст, лица, действия, предметы на полу и т.д.
    

**2. Язык и стиль:**

- Дружелюбный, спокойный, ясный. Короткие предложения. Периодически обращайся к Жеке по имени.
    
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


export const useVisionAssistant = (videoRef: RefObject<HTMLVideoElement>) => {
    const [status, setStatus] = useState<Status>('idle');
    const [transcription, setTranscription] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sessionTime, setSessionTime] = useState(0);

    const sessionRef = useRef<any | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<number | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextAudioStartTimeRef = useRef<number>(0);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const sessionHandleRef = useRef<string | null>(null);
    const isIntentionalStopRef = useRef(false);

    const cleanupSession = useCallback((isFullStop: boolean) => {
        console.log(`Cleaning up session. Full stop: ${isFullStop}`);
        
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (isFullStop && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (sessionRef.current) {
             if (typeof sessionRef.current.close === 'function') {
                sessionRef.current.close();
            }
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
         if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             audioSourcesRef.current.forEach(source => source.stop());
             audioSourcesRef.current.clear();
             outputAudioContextRef.current.close();
             outputAudioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        if (isFullStop) {
            setStatus('idle');
            setTranscription('');
            setErrorMessage(null);
            setSessionTime(0);
            sessionHandleRef.current = null; // Clear handle on full stop
        }
    }, [videoRef]);
    
    const stopSession = useCallback(() => {
        console.log('Stopping session intentionally...');
        isIntentionalStopRef.current = true;
        cleanupSession(true);
    }, [cleanupSession]);

    const startSession = useCallback(async () => {
        // Prevent starting a new session if one is already connecting or active
        if (status === 'connecting' || status === 'active') {
            return;
        }
        isIntentionalStopRef.current = false;

        const apiKey = localStorage.getItem('gemini-api-key');
        if (!apiKey) {
            setErrorMessage('API ключ не найден. Пожалуйста, укажите его в настройках (значок ⚙️).');
            setStatus('error');
            return;
        }

        setStatus('connecting');
        setErrorMessage(null);
        setTranscription('Запрос разрешений...');

        if (status === 'idle') { // Only reset timer on a fresh start
            setSessionTime(0);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = window.setInterval(() => {
                setSessionTime(prevTime => prevTime + 1);
            }, 1000);
        }

        try {
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
            if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
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

            const ai = new GoogleGenAI({ apiKey });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            setTranscription('Подключение к Gemini...');
            
            const connectConfig: ConnectConfig['config'] = {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: SYSTEM_PROMPT,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            };
            
            if (sessionHandleRef.current) {
                connectConfig.sessionResumption = { handle: sessionHandleRef.current };
                console.log('Attempting to resume session with handle.');
            } else {
                console.log('Starting a new session.');
            }
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: connectConfig,
                callbacks: {
                    onopen: () => {
                        console.log('Session opened.');
                        setStatus('active');
                        setTranscription('Сессия активна. Описываю окружение...');
                        if ('vibrate' in navigator) navigator.vibrate(100);

                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
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

                        if (message.serverContent?.goAway) {
                            console.warn(`Server is closing the connection (GoAway). Time left: ${message.serverContent.goAway.timeLeft}s. Reconnecting...`);
                            if (sessionRef.current && typeof sessionRef.current.close === 'function') {
                                sessionRef.current.close();
                            }
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
                            
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });

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
                        console.error('Session error:', e);
                        const errorEvent = e as ErrorEvent;
                        let msg = errorEvent.message || "Произошла неизвестная ошибка.";
                        
                        if (msg.includes('API key not valid')) {
                            msg = 'Неверный API ключ. Проверьте его в настройках.';
                            isIntentionalStopRef.current = true; // This is fatal
                            setErrorMessage(msg);
                            setStatus('error');
                            cleanupSession(true);
                            return;
                        }

                        if (msg.toLowerCase().includes('network error')) {
                            msg = 'Сетевая ошибка. Проверьте интернет и отключите блокировщики рекламы.';
                        }

                        if (sessionHandleRef.current) {
                            console.warn("Error with session handle, clearing it for reconnection attempt.");
                            sessionHandleRef.current = null;
                        }
                        
                        setErrorMessage(msg);
                        setStatus('error');
                    },
                    onclose: () => {
                        console.log('Session closed.');
                        if (isIntentionalStopRef.current) {
                            console.log('Closure was intentional, not reconnecting.');
                            return;
                        }
                        
                        console.log('Unexpected closure. Attempting to reconnect...');
                        cleanupSession(false);
                        setTimeout(() => startSession(), 1000);
                    },
                }
            });
            sessionRef.current = await sessionPromiseRef.current;

        } catch (err) {
            console.error('Failed to start session:', err);
            let message = err instanceof Error ? err.message : String(err);
            if (message.toLowerCase().includes('network')) {
                message = 'Сетевая ошибка. Проверьте интернет и отключите блокировщики рекламы.';
            } else {
                 message = `Не удалось запустить сессию: ${message}`;
            }
            setErrorMessage(message);
            setStatus('error');
            cleanupSession(true);
        }
    }, [status, cleanupSession, videoRef]);

    return { status, startSession, stopSession, transcription, errorMessage, sessionTime };
};