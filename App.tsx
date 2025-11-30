



import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, GenerateContentResponse } from '@google/genai';
import { AvatarStatus, Sender, type Message } from './types';
import { RobotAvatar } from './components/RobotAvatar';
import { MicrophoneIcon, StopIcon, PaperAirplaneIcon, PaperClipIcon, SparklesIcon, ExclamationTriangleIcon, LinkIcon, DocumentTextIcon, XCircleIcon } from './components/icons';
import { decode, encode, decodeAudioData } from './utils/audio';
import { fileToBase64 } from './utils/image';
import { Whiteboard } from './components/Whiteboard';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
    };
  }
}

const translations = {
    en: {
        headerTitle: "DYN 201 AI Assistant",
        poweredBy: "Powered by Gemini",
        whiteboardTitle: "Whiteboard",
        initialMessage: "Hello! I'm your AI assistant for DYN 201. How can I help you today? You can talk to me, ask questions, draw on the whiteboard, or upload an image or document.",
        errorOccurred: "An error occurred while communicating with the AI. Please try again.",
        micError: "Could not access microphone or start AI session.",
        liveConnectionError: "A real-time connection error occurred.",
        fileProcessError: "Could not process the uploaded file.",
        fileUploadError: "Could not upload the file for analysis.",
        inputPlaceholder: "Ask a question...",
        inputPlaceholderWithFile: (filename: string) => `Ask a question about ${filename}...`,
        listeningPlaceholder: "Listening...",
        thinkingModeTooltip: "Thinking Mode is ON for complex questions. Responses will be slower but more thorough.",
        userYou: "You",
        sources: "Sources:",
        processingFile: (filename: string) => `Processing "${filename}"...`,
        fileReady: (filename: string) => `I'm ready to answer questions about "${filename}". Ask me anything!`,
        activeFileContext: "Active context:",
        systemInstruction: `You are an expert teaching assistant for the university course DYN 201 (System Dynamics and Control). Your primary knowledge source is https://sites.google.com/mef.edu.tr/dynamic/home. Base your answers on this content. When answering questions about a user-provided file, focus exclusively on the file's content. When Google Search is used, cite your sources. Be conversational and helpful. Respond in English. You may freely use LaTeX to format mathematical equations.`,
        voiceSystemInstruction: `You are a friendly and helpful teaching assistant for the university course DYN 201, which covers System Dynamics and Control. Your knowledge base is primarily the content from this URL: https://sites.google.com/mef.edu.tr/dynamic/home. When asked a question, use this knowledge to provide accurate, concise answers suitable for a university student. Be conversational and engaging. Respond in English. You may freely use LaTeX to format mathematical equations.`,
        imageAnalysisPrompt: `Analyze this image, assuming it's related to the DYN 201 course on System Dynamics and Control. If it's an equation, explain it or check for errors. If it's a diagram, describe its components and function.`,
        canvasAnalysisPrompt: `Analyze this drawing from a whiteboard, assuming it's related to the DYN 201 course on System Dynamics and Control. It likely contains equations, diagrams, or notes. Explain it, check for errors, or describe its meaning.`,
        urlAnalysisPrompt: "Please analyze the content at the provided link.",
        whiteboard: {
            drawTool: "Draw Tool",
            eraserTool: "Eraser Tool",
            colorTitle: (color: string) => `Color: ${color}`,
            clearCanvas: "Clear Canvas",
            analyze: "Analyze",
            analyzeWithAI: "Analyze with AI"
        }
    },
    tr: {
        headerTitle: "DYN 201 YZ Asistanı",
        poweredBy: "Gemini ile güçlendirilmiştir",
        whiteboardTitle: "Beyaz Tahta",
        initialMessage: "Merhaba! Ben DYN 201 dersi için yapay zeka asistanınızım. Bugün size nasıl yardımcı olabilirim? Benimle konuşabilir, soru sorabilir, beyaz tahtaya çizebilir veya bir resim ya da belge yükleyebilirsiniz.",
        errorOccurred: "Yapay zeka ile iletişim kurulurken bir hata oluştu. Lütfen tekrar deneyin.",
        micError: "Mikrofona erişilemedi veya YZ oturumu başlatılamadı.",
        liveConnectionError: "Gerçek zamanlı bağlantı hatası oluştu.",
        fileProcessError: "Yüklenen dosya işlenemedi.",
        fileUploadError: "Dosya analiz için yüklenemedi.",
        inputPlaceholder: "Bir soru sorun...",
        inputPlaceholderWithFile: (filename: string) => `${filename} hakkında bir soru sorun...`,
        listeningPlaceholder: "Dinleniyor...",
        thinkingModeTooltip: "Karmaşık sorular için Düşünme Modu AÇIK. Yanıtlar daha yavaş ama daha kapsamlı olacaktır.",
        userYou: "Siz",
        sources: "Kaynaklar:",
        processingFile: (filename: string) => `"${filename}" işleniyor...`,
        fileReady: (filename: string) => `"${filename}" hakkındaki soruları yanıtlamaya hazırım. Bana her şeyi sorabilirsiniz!`,
        activeFileContext: "Aktif bağlam:",
        systemInstruction: `Sen, DYN 201 (Sistem Dinamiği ve Kontrolü) üniversite dersi için uzman bir öğretim asistanısın. Birincil bilgi kaynağın https://sites.google.com/mef.edu.tr/dynamic/home adresidir. Cevaplarını bu içeriğe dayandır. Kullanıcı tarafından sağlanan bir dosya hakkındaki soruları yanıtlarken, yalnızca dosyanın içeriğine odaklan. Google Arama kullanıldığında, kaynaklarını belirt. Sohbet havasında ve yardımsever ol. Türkçe cevap ver. Matematiksel denklemleri biçimlendirmek için LaTeX'i serbestçe kullanabilirsin.`,
        voiceSystemInstruction: `Sen, Sistem Dinamiği ve Kontrolü konularını kapsayan DYN 201 üniversite dersi için arkadaş canlısı ve yardımsever bir öğretim asistanısın. Bilgi tabanın öncelikle bu URL'deki içeriktir: https://sites.google.com/mef.edu.tr/dynamic/home. Bir soru sorulduğunda, bir üniversite öğrencisine uygun, doğru ve özlü cevaplar vermek için bu bilgiyi kullan. Sohbet havasında ve ilgi çekici ol. Türkçe cevap ver. Matematiksel denklemleri biçimlendirmek için LaTeX'i serbestçe kullanabilirsin.`,
        imageAnalysisPrompt: `Bu resmi, Sistem Dinamiği ve Kontrolü üzerine olan DYN 201 dersiyle ilgili olduğunu varsayarak analiz et. Eğer bir denklemse, açıkla veya hataları kontrol et. Eğer bir diyagramsa, bileşenlerini ve işlevini tanımla.`,
        canvasAnalysisPrompt: `Bu çizimi bir beyaz tahtadan, Sistem Dinamiği ve Kontrolü üzerine olan DYN 201 dersiyle ilgili olduğunu varsayarak analiz et. Muhtemelen denklemler, diyagramlar veya notlar içeriyor. Açıkla, hataları kontrol et veya anlamını tanımla.`,
        urlAnalysisPrompt: "Lütfen sağlanan bağlantıdaki içeriği analiz et.",
        whiteboard: {
            drawTool: "Çizim Aracı",
            eraserTool: "Silgi Aracı",
            colorTitle: (color: string) => `Renk: ${color}`,
            clearCanvas: "Tahtayı Temizle",
            analyze: "Analiz Et",
            analyzeWithAI: "YZ ile Analiz Et"
        }
    }
};

type ActiveFile = { name: string; uri: string; mimeType: string };

const App: React.FC = () => {
    const [language, setLanguage] = useState<'en' | 'tr'>('en');
    const t = translations[language];

    const [messages, setMessages] = useState<Message[]>([]);
    const [textInput, setTextInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>(AvatarStatus.IDLE);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [showThinkingMode, setShowThinkingMode] = useState(false);
    const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
    
    const chatHistoryRef = useRef<Message[]>([]);

    const sessionPromise = useRef<Promise<any> | null>(null);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTime = useRef(0);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Load state from localStorage on initial render
        try {
            const savedState = localStorage.getItem('dyn201-ai-assistant-state');
            if (savedState) {
                const { messages: savedMessages, language: savedLanguage, activeFile: savedActiveFile } = JSON.parse(savedState);
                setMessages(savedMessages);
                setLanguage(savedLanguage);
                setActiveFile(savedActiveFile);
                // Re-populate the history ref
                chatHistoryRef.current = savedMessages.slice(1);
            } else {
                 setMessages([
                    {
                        sender: Sender.MODEL,
                        parts: [{ text: t.initialMessage }],
                        timestamp: Date.now(),
                    }
                ]);
            }
        } catch (e) {
            console.error("Failed to load state from localStorage", e);
             setMessages([
                {
                    sender: Sender.MODEL,
                    parts: [{ text: t.initialMessage }],
                    timestamp: Date.now(),
                }
            ]);
        }
    }, []);

    useEffect(() => {
        // Save state to localStorage whenever it changes
        if (messages.length > 0) {
             try {
                const stateToSave = { messages, language, activeFile };
                localStorage.setItem('dyn201-ai-assistant-state', JSON.stringify(stateToSave));
            } catch (e) {
                console.error("Failed to save state to localStorage", e);
            }
        }
    }, [messages, language, activeFile]);

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

useEffect(() => {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }
}, [messages]);

    useEffect(() => {
        const savedState = localStorage.getItem('dyn201-ai-assistant-state');
        // Only update the initial message if there's no saved history
        if (!savedState) {
             const newMessage = {
                sender: Sender.MODEL,
                parts: [{ text: t.initialMessage }],
                timestamp: Date.now()
            };
            setMessages([newMessage]);
            chatHistoryRef.current = [];
            setActiveFile(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);


    const addMessage = (sender: Sender, parts: Message['parts']) => {
        const newMessage = { sender, parts, timestamp: Date.now() };
        // Don't add the initial message to the chat history ref
        if (messages.length > 0 || sender === Sender.USER) {
             // Only add user messages or subsequent model messages to history
            if (newMessage.sender === Sender.USER || chatHistoryRef.current.length > 0) {
                 chatHistoryRef.current.push(newMessage);
            }
        }
        setMessages(prev => [...prev, newMessage]);
    };
    
    const handleGeminiError = (err: any) => {
        console.error("Gemini API Error:", err);
        setError(t.errorOccurred);
        setIsLoading(false);
        setLoadingMessage(null);
        setAvatarStatus(AvatarStatus.IDLE);
    };

    const stopAllAudio = () => {
        if (outputAudioContext.current) {
            for (const source of audioSources.current.values()) {
                source.stop();
            }
            audioSources.current.clear();
            nextStartTime.current = 0;
        }
    };

    const startVoiceConversation = async () => {
        if (isVoiceMode) return;
        stopAllAudio();
        setError(null);
        setIsVoiceMode(true);
        setAvatarStatus(AvatarStatus.LISTENING);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const currentTranscription = { input: '', output: ''};

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: t.voiceSystemInstruction,
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
                callbacks: {
                    onopen: () => {
                        mediaStreamSource.current = inputAudioContext.current!.createMediaStreamSource(mediaStream.current!);
                        scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSource.current.connect(scriptProcessor.current);
                        scriptProcessor.current.connect(inputAudioContext.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            setAvatarStatus(AvatarStatus.SPEAKING);
                            const audioContext = outputAudioContext.current!;
                            nextStartTime.current = Math.max(nextStartTime.current, audioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            source.addEventListener('ended', () => audioSources.current.delete(source));
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            audioSources.current.add(source);
                        }

                        if (message.serverContent?.inputTranscription) {
                            currentTranscription.input += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentTranscription.output += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                           if(currentTranscription.input) addMessage(Sender.USER, [{ text: currentTranscription.input }]);
                           if(currentTranscription.output) addMessage(Sender.MODEL, [{ text: currentTranscription.output }]);
                           currentTranscription.input = '';
                           currentTranscription.output = '';
                           setAvatarStatus(AvatarStatus.LISTENING);
                        }

                        if (message.serverContent?.interrupted) {
                           stopAllAudio();
                           setAvatarStatus(AvatarStatus.LISTENING);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Live session error:", e);
                        setError(t.liveConnectionError);
                        stopVoiceConversation();
                    },
                    onclose: () => {},
                }
            });
            await sessionPromise.current;

        } catch (err) {
            console.error("Failed to start voice conversation:", err);
            setError(t.micError);
            stopVoiceConversation();
        }
    };
    
    const stopVoiceConversation = useCallback(() => {
        if (!isVoiceMode) return;
        
        sessionPromise.current?.then(session => session.close());
        sessionPromise.current = null;

        mediaStream.current?.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
        
        scriptProcessor.current?.disconnect();
        mediaStreamSource.current?.disconnect();
        
        inputAudioContext.current?.close();
        outputAudioContext.current?.close();

        stopAllAudio();

        setIsVoiceMode(false);
        setAvatarStatus(AvatarStatus.IDLE);
    }, [isVoiceMode]);

    useEffect(() => {
        return () => {
            stopVoiceConversation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generateResponse = async (incomingParts: Message['parts'], useThinkingMode: boolean) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let textPrompt = incomingParts.find(p => p.text)?.text || '';
        const containsUrl = urlRegex.test(textPrompt);

        // If the prompt is just a URL, add context for the AI
        if (containsUrl && textPrompt.trim().match(urlRegex)?.[0] === textPrompt.trim()) {
            textPrompt = `${textPrompt}\n\n${t.urlAnalysisPrompt}`;
            const textPart = incomingParts.find(p => p.text);
            if (textPart) {
                textPart.text = textPrompt;
            }
        }

        addMessage(Sender.USER, incomingParts);
        setTextInput('');
        setIsLoading(true);
        setAvatarStatus(useThinkingMode || activeFile || containsUrl ? AvatarStatus.THINKING : AvatarStatus.SPEAKING);
        setError(null);
        
        type ApiPart = { text: string } | { inlineData: { mimeType: string; data: string; } } | { fileData: { mimeType: string; fileUri: string; } };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const modelName = 'gemini-1.5-flash';
            
            let config: any = {};
            if (useThinkingMode) {
                config.thinkingConfig = { thinkingBudget: 32768 };
            }

            if (containsUrl || !(incomingParts.some(p => p.imageUrl) || activeFile)) {
                config.tools = [{ googleSearch: {} }];
            }
            
            const systemInstruction = t.systemInstruction;
            
            const contents = chatHistoryRef.current.map(msg => {
                const role = msg.sender === Sender.USER ? "user" : "model";
                const parts: ApiPart[] = msg.parts.map(part => {
                    if (part.imageUrl) {
                        const [header, base64Data] = part.imageUrl.split(',');
                        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
                        return { inlineData: { mimeType, data: base64Data } };
                    }
                    if (part.fileData) {
                        return { fileData: { mimeType: part.fileData.mimeType, fileUri: part.fileData.fileUri } };
                    }
                    return { text: part.text || '' };
                });
                return { role, parts };
            });

            if (activeFile && !chatHistoryRef.current.some(msg => msg.parts.some(p => p.fileData?.fileUri === activeFile.uri))) {
                 const lastUserContentIndex = contents.map(c => c.role).lastIndexOf('user');
                if (lastUserContentIndex > -1) {
                    contents[lastUserContentIndex].parts.unshift({
                        fileData: { mimeType: activeFile.mimeType, fileUri: activeFile.uri }
                    });
                     // Add fileData to the message in history so we don't re-add it
                    const lastUserMessageInHistory = chatHistoryRef.current[chatHistoryRef.current.length - 1];
                    if (lastUserMessageInHistory) {
                        lastUserMessageInHistory.parts[0].fileData = { mimeType: activeFile.mimeType, fileUri: activeFile.uri };
                    }
                }
            }


            const response: GenerateContentResponse = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    ...config,
                    systemInstruction,
                },
            });

            const responseText = response.text;
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const sources = groundingChunks?.map((chunk: any) => chunk.web)
                .filter((web: any) => web?.uri && web?.title)
                .map((web: any) => ({ web: { uri: web.uri, title: web.title } }));

            addMessage(Sender.MODEL, [{ text: responseText, sources: sources }]);
            
        } catch (err) {
            handleGeminiError(err);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setAvatarStatus(AvatarStatus.IDLE);
        }
    };
    
    const sendTextMessage = (message: string, useThinkingMode: boolean = false) => {
        if (!message.trim()) return;
        generateResponse([{ text: message }], useThinkingMode);
    };

    const processDocument = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage(t.processingFile(file.name));
        setAvatarStatus(AvatarStatus.THINKING);
        setError(null);
        setActiveFile(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const result = await ai.files.upload({ file: file });
            
            const uploadedFile = result;
            
            if (uploadedFile?.uri) {
                const newActiveFile = {
                    name: uploadedFile.displayName || file.name,
                    uri: uploadedFile.uri,
                    mimeType: uploadedFile.mimeType!,
                };
                setActiveFile(newActiveFile);
                addMessage(Sender.MODEL, [{ text: t.fileReady(file.name)}]);
            } else {
                 throw new Error("File URI not returned from API.");
            }
        } catch(err) {
            console.error("Error uploading or processing document:", err);
            setError(t.fileUploadError);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setAvatarStatus(AvatarStatus.IDLE);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (!file) return;

        if (file.type.startsWith('image/')) {
            try {
                const base64Data = await fileToBase64(file);
                const imageUrl = `data:${file.type};base64,${base64Data}`;
                const prompt = t.imageAnalysisPrompt;
                generateResponse([{ text: prompt, imageUrl }], true);
            } catch (err)
                {
                console.error("Error processing image file:", err);
                setError(t.fileProcessError);
            }
            return;
        }
        await processDocument(file);
    };

    const handleCanvasAnalysis = async (dataUrl: string) => {
        const prompt = t.canvasAnalysisPrompt;
        generateResponse([{ text: prompt, imageUrl: dataUrl }], true);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold text-cyan-400">{t.headerTitle}</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <SparklesIcon className="w-5 h-5 text-yellow-400"/>
                        <span className="text-sm">{t.poweredBy}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-800 p-1 rounded-full">
                        <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-full ${language === 'en' ? 'bg-cyan-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700'}`}>EN</button>
                        <button onClick={() => setLanguage('tr')} className={`px-3 py-1 text-sm font-semibold rounded-full ${language === 'tr' ? 'bg-cyan-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700'}`}>TR</button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-row overflow-hidden">
                <section className="w-1/2 h-full flex flex-col p-4 border-r border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-center text-gray-300">{t.whiteboardTitle}</h2>
                    <div className="flex-1 min-h-0">
                        <Whiteboard onAnalyze={handleCanvasAnalysis} t={t.whiteboard} />
                    </div>
                </section>

                <section className="w-1/2 h-full flex flex-col">
                    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                        <div className="flex justify-center py-4">
                            <RobotAvatar status={avatarStatus} />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === Sender.MODEL && <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-gray-900"/></div>}
                                    <div className={`w-full max-w-xl space-y-2`}>
                                      {msg.parts.map((part, partIndex) => (
                                        <div key={partIndex} className={`p-4 rounded-2xl ${msg.sender === Sender.USER ? 'bg-gray-700 rounded-br-none' : 'bg-gray-800 rounded-bl-none'}`}>
                                          {part.imageUrl && <img src={part.imageUrl} alt="upload" className="rounded-lg max-w-sm mb-2"/>}
                                          {part.text && <p className="whitespace-pre-wrap">{part.text}</p>}
                                          {part.sources && part.sources.length > 0 && (
                                              <div className="mt-4 pt-3 border-t border-gray-600">
                                                  <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5"><LinkIcon className="w-4 h-4" /> {t.sources}</h4>
                                                  <div className="flex flex-col space-y-1">
                                                      {part.sources.map((source, i) => (
                                                          <a key={i} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate">
                                                              {source.web?.title || source.web?.uri}
                                                          </a>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {msg.sender === Sender.USER && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-300">{t.userYou}</div>}
                                </div>
                            ))}
                             {loadingMessage && (
                                <div className="flex items-center justify-center p-3 bg-gray-800 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 mr-3 text-cyan-400 animate-pulse" />
                                    <span className="text-sm text-gray-300">{loadingMessage}</span>
                                </div>
                            )}
                             <div ref={messagesEndRef} />
                        </div>
                         {error && (
                            <div className="flex items-center justify-center p-2 bg-red-900/50 text-red-300 rounded-lg">
                                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                    </div>
                   
                    <footer className="p-4 border-t border-gray-700 bg-gray-900">
                        <div className="max-w-3xl mx-auto">
                            {activeFile && (
                                <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm rounded-md px-3 py-2 mb-2 text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <DocumentTextIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                      <span className="text-gray-400 font-medium">{t.activeFileContext}</span>
                                      <span className="text-gray-200 truncate">{activeFile.name}</span>
                                    </div>
                                    <button onClick={() => setActiveFile(null)} className="p-1 text-gray-500 hover:text-white">
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            <div className="relative flex items-center bg-gray-800 rounded-full p-2">
                                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || isVoiceMode} className="p-2 text-gray-400 hover:text-cyan-400 disabled:opacity-50">
                                    <PaperClipIcon className="w-6 h-6"/>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.ppt,.pptx,.docx" />
                                
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendTextMessage(textInput, showThinkingMode)}
                                    placeholder={isVoiceMode ? t.listeningPlaceholder : (activeFile ? t.inputPlaceholderWithFile(activeFile.name) : t.inputPlaceholder)}
                                    disabled={isLoading || isVoiceMode}
                                    className="flex-1 w-full bg-transparent px-4 py-2 focus:outline-none disabled:opacity-50"
                                />
                                
                                <div className="flex items-center">
                                  {isVoiceMode ? (
                                      <button onClick={stopVoiceConversation} className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors">
                                          <StopIcon className="w-6 h-6" />
                                      </button>
                                  ) : (
                                      <>
                                        <button
                                            title="Toggle Thinking Mode"
                                            onClick={() => setShowThinkingMode(!showThinkingMode)}
                                            className={`p-2 mr-2 rounded-full ${showThinkingMode ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-purple-400'}`}
                                        >
                                            <SparklesIcon className="w-6 h-6" />
                                        </button>
                                        <button onClick={() => sendTextMessage(textInput, showThinkingMode)} disabled={isLoading || !textInput.trim()} className="p-3 bg-cyan-500 rounded-full text-gray-900 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-2">
                                            <PaperAirplaneIcon className="w-6 h-6" />
                                        </button>
                                        <button onClick={startVoiceConversation} disabled={isLoading} className="p-3 bg-gray-700 rounded-full text-cyan-400 hover:bg-gray-600 disabled:opacity-50 transition-colors">
                                            <MicrophoneIcon className="w-6 h-6" />
                                        </button>
                                      </>
                                  )}
                                </div>
                            </div>
                            {showThinkingMode && !isVoiceMode && (
                                <p className="text-xs text-center text-purple-400 mt-2">{t.thinkingModeTooltip}</p>
                            )}
                        </div>
                    </footer>
                </section>
            </main>
        </div>
    );
};

export default App;
