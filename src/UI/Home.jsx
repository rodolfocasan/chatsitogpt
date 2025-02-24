// src/UI/Home.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ArrowDown } from 'lucide-react';
import axios from 'axios';





// Importación de los estilos para los diferentes loaders
import './Loaders/loader1.css';
import './Loaders/loader2.css';
import './Loaders/loader3.css';
import './Loaders/loader4.css';
import './Loaders/loader5.css';
import './Loaders/loader6.css';

const LOADERS = {
    1: { className: 'loader-1', text: '.' },
    2: { className: 'loader-2', text: '.' },
    3: { className: 'loader-3', text: '.' },
    4: { className: 'loader-4', text: '.' },
    5: { className: 'loader-5', text: '.' },
    6: { className: 'loader-6', text: '.' }
};





// Configuración de la instancia base de axios con los headers predeterminados
const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false // Deshabilitado para permitir peticiones CORS
});

// Interceptor para el manejo global de errores en las peticiones
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        console.error('Error en la petición:', error);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
        return Promise.reject(error);
    }
);





// Componente que muestra la animación de carga
const LoadingAnimation = ({ type }) => {
    const loader = LOADERS[type] || LOADERS[1];
    return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className={loader.className} />
            <span className="text-gray-400 text-sm">{loader.text}</span>
        </div>
    );
};

// Componente que renderiza un mensaje individual
const Message = ({ message, isBot }) => (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`flex items-start space-x-2 max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
            {isBot && (
                <img
                    src="/icon.svg"
                    alt="ChatsitoGPT"
                    className="w-8 h-8 rounded-full"
                />
            )}
            <div className={`rounded-2xl p-4 ${isBot
                ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 text-white'
                : 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white'
                }`}>
                {message}
            </div>
        </div>
    </div>
);

// Componente del input para enviar mensajes
const ChatInput = ({ onSendMessage, isLoading }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 bg-gray-800/50 backdrop-blur-xl border-t border-gray-700/30">
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gray-700/50 p-4 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all"
                />
                {message && (
                    <button
                        type="button"
                        onClick={() => setMessage('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white transition-all hover:opacity-90 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
                <Send size={20} />
            </button>
        </form>
    );
};

// Componente principal de la interfaz de chat
const ChatInterface = () => {
    // Estados iniciales del componente
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        console.log('🔄 Inicializando mensajes desde localStorage:', savedMessages);
        return savedMessages ? JSON.parse(savedMessages) : [
            { text: "¡Hola! Soy ChatsitoGPT, ¿en qué puedo ayudarte hoy?", isBot: true }
        ];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [loaderType, setLoaderType] = useState(1);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Referencias para elementos del DOM y control de intervalos
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const statusIntervalRef = useRef(null);
    const pollCountRef = useRef(0); // Nuevo: referencia para contar intentos de polling

    // Función para hacer scroll hasta el último mensaje
    const scrollToBottom = (behavior = 'smooth') => {
        console.log(' - Realizando scroll al final del chat');
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Función para realizar peticiones HTTP seguras
    const makeApiRequest = async (url, method, data = null) => {
        const apiUrl = localStorage.getItem('ngrokApiUrl');
        console.log(` - Realizando petición ${method} a ${url}`, data ? `con datos: ${JSON.stringify(data)}` : '');

        if (!apiUrl) {
            console.error(' - URL de API no configurada');
            throw new Error('URL de API no configurada');
        }

        const fullUrl = `${apiUrl}${url}`;
        console.log(` - URL completa: ${fullUrl}`);

        try {
            const config = {
                method,
                url: fullUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',

                    // Agregamos headers específicos para ngrok
                    'ngrok-skip-browser-warning': 'true',
                    'Access-Control-Allow-Origin': '*'
                },
                // Configuración adicional para manejar CORS
                withCredentials: false
            };

            if (data) {
                config.data = data;
            }

            console.log('📡 Configuración de la petición:', config);
            const response = await axiosInstance(config);

            // Verificar si la respuesta es HTML (error de ngrok)
            if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                console.error(' - Respuesta HTML recibida de ngrok:', response.data);
                throw new Error('Error de autenticación de ngrok');
            }

            console.log(` - Respuesta recibida de ${url}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(` - Error en petición ${method} a ${url}:`, error);
            if (error.response) {
                console.error(' - Datos de la respuesta de error:', error.response.data);
            }
            // Si es un error de ngrok, mostrar mensaje específico
            if (error.message === 'Error de autenticación de ngrok') {
                throw new Error('Error de conexión con ngrok. Por favor, asegúrate de que la URL es correcta y que has aceptado la advertencia de ngrok en una nueva pestaña.');
            }
            throw error;
        }
    };

    // Función para verificar el estado del procesamiento
    const checkProcessingStatus = async () => {
        try {
            console.log(' - Verificando estado de procesamiento...');
            const status = await makeApiRequest('/status', 'GET');
            console.log(' - Estado actual:', status);
            return !status.is_processing; // Retorna true cuando is_processing es false
        } catch (error) {
            console.error(' - Error al verificar estado:', error);
            throw error;
        }
    };

    // Función para obtener la respuesta final
    const getConversationResponse = async () => {
        try {
            console.log(' - Obteniendo respuesta de la conversación...');
            const conversations = await makeApiRequest('/api/conversations', 'GET');
            console.log(' - Conversaciones recibidas:', conversations);

            if (conversations && Array.isArray(conversations) && conversations.length > 0) {
                const lastResponse = conversations[conversations.length - 1];
                if (lastResponse && lastResponse.response) {
                    console.log(' - Respuesta extraída:', lastResponse.response);
                    return lastResponse.response;
                }
            }
            console.error(' - Formato de respuesta inválido');
            throw new Error('Formato de respuesta inválido');
        } catch (error) {
            console.error(' - Error al obtener la respuesta:', error);
            throw error;
        }
    };

    // Función principal para manejar el polling del estado
    const handleStatusPolling = async () => {
        console.log(' - Iniciando proceso de polling');

        return new Promise((resolve, reject) => {
            // Limpiar cualquier intervalo existente
            if (statusIntervalRef.current) {
                console.log(' - Limpiando intervalo existente');
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }

            // Reiniciar contador de intentos
            pollCountRef.current = 0;

            // Iniciar nuevo intervalo de polling
            statusIntervalRef.current = setInterval(async () => {
                try {
                    pollCountRef.current++;
                    console.log(` - Intento de polling #${pollCountRef.current}`);

                    // Verificar límite de intentos (5 minutos = 300 segundos)
                    if (pollCountRef.current >= 300) {
                        console.error(' - Tiempo máximo de polling excedido');
                        clearInterval(statusIntervalRef.current);
                        reject(new Error('Tiempo de espera excedido'));
                        return;
                    }

                    const isComplete = await checkProcessingStatus();
                    console.log(` - Estado de procesamiento: ${isComplete ? 'Completado' : 'En proceso'}`);

                    if (isComplete) {
                        console.log(' - Procesamiento completado, limpiando intervalo');
                        clearInterval(statusIntervalRef.current);

                        console.log(' - Esperando 2 segundos antes de obtener la respuesta...');
                        // Esperar 2 segundos antes de obtener la respuesta
                        setTimeout(async () => {
                            try {
                                const response = await getConversationResponse();
                                console.log(' - Respuesta final obtenida:', response);
                                resolve(response);
                            } catch (error) {
                                console.error(' - Error al obtener respuesta final:', error);
                                reject(error);
                            }
                        }, 2000);
                    }
                } catch (error) {
                    console.error(' - Error durante el polling:', error);
                    clearInterval(statusIntervalRef.current);
                    reject(error);
                }
            }, 1000); // Comprobar cada segundo
        });
    };

    // Función principal para manejar el envío de mensajes
    const handleSendMessage = async (message) => {
        console.log(' - Iniciando envío de mensaje:', message);

        try {
            const apiUrl = localStorage.getItem('ngrokApiUrl');
            if (!apiUrl) {
                console.error(' - URL de API no configurada');
                setMessages(prev => [...prev,
                { text: message, isBot: false },
                { text: "Por favor, configura la URL de la API primero.", isBot: true }
                ]);
                return;
            }

            // Agregar mensaje del usuario al chat
            setMessages(prev => {
                console.log(' - Agregando mensaje del usuario al chat');
                return [...prev, { text: message, isBot: false }];
            });

            setIsLoading(true);
            console.log(' - Activando estado de carga');

            // Seleccionar loader aleatorio
            const availableLoaders = Object.keys(LOADERS).map(Number);
            const randomLoader = availableLoaders[Math.floor(Math.random() * availableLoaders.length)];
            console.log(' - Loader seleccionado:', randomLoader);
            setLoaderType(randomLoader);

            // Enviar el prompt
            console.log(' - Enviando prompt al servidor');
            await makeApiRequest('/execute', 'POST', {
                "--prompt": message
            });

            // Iniciar polling y esperar respuesta
            console.log(' - Iniciando proceso de polling');
            const response = await handleStatusPolling();

            // Agregar respuesta al chat
            console.log(' - Agregando respuesta al chat:', response);
            setMessages(prev => [...prev, { text: response, isBot: true }]);

        } catch (error) {
            console.error(' - Error en el proceso completo:', error);
            setMessages(prev => [...prev, {
                text: "Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.",
                isBot: true
            }]);
        } finally {
            console.log(' - Finalizando proceso, desactivando estado de carga');
            setIsLoading(false);
        }
    };

    // Efecto para guardar mensajes en localStorage y hacer scroll
    useEffect(() => {
        console.log(' - Guardando mensajes en localStorage');
        localStorage.setItem('chatMessages', JSON.stringify(messages));

        if (!isLoading) {
            console.log(' - Realizando scroll automático');
            scrollToBottom();
        }
    }, [messages, isLoading]);

    // Efecto para manejar la visibilidad del botón de scroll
    useEffect(() => {
        const container = chatContainerRef.current;

        const handleScroll = () => {
            if (!container) return;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        };

        console.log(' - Configurando evento de scroll');
        container?.addEventListener('scroll', handleScroll);
        return () => {
            console.log(' - Limpiando evento de scroll');
            container?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Efecto para limpiar el intervalo al desmontar el componente
    useEffect(() => {
        return () => {
            if (statusIntervalRef.current) {
                console.log(' - Limpiando intervalo al desmontar');
                clearInterval(statusIntervalRef.current);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-black to-purple-900">
            <div className="flex items-center justify-center p-4 bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/30">
                <h1 className="text-xl font-bold text-white">ChatsitoGPT</h1>
            </div>

            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-4 custom-scrollbar"
            >
                <div className="max-w-4xl mx-auto">
                    {messages.map((message, index) => (
                        <Message key={index} message={message.text} isBot={message.isBot} />
                    ))}
                    {isLoading && <LoadingAnimation type={loaderType} />}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom()}
                    className="fixed bottom-24 right-8 p-2 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all animate-bounce"
                >
                    <ArrowDown size={24} />
                </button>
            )}

            <div className="relative">
                <div className="max-w-4xl mx-auto w-full">
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

// Estilos personalizados para la barra de desplazamiento
const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.7);
  }
`;

// Componente principal de la página
export default function Home() {
    return (
        <React.Fragment>
            <style>{styles}</style>
            <ChatInterface />
        </React.Fragment>
    );
}