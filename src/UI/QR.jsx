// src/UI/QR.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Camera, Keyboard, Check } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";





export default function QR() {
    const [isOpen, setIsOpen] = useState(false);
    const [apiUrl, setApiUrl] = useState('');
    const [error, setError] = useState('');
    const [inputMethod, setInputMethod] = useState('manual');
    const [isSaved, setIsSaved] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showBypassModal, setShowBypassModal] = useState(false);

    const html5QrCode = useRef(null);
    const settingsPanelRef = useRef(null);

    // Iniciar el escaneo en tiempo real
    const startRealTimeScanning = async () => {
        try {
            html5QrCode.current = new Html5Qrcode("qr-reader");
            setIsScanning(true);

            const config = {
                fps: 10,
                qrbox: {
                    width: window.innerWidth < 600 ? 250 : 300,
                    height: window.innerWidth < 600 ? 250 : 300
                },
                aspectRatio: 1.0,
            };

            await html5QrCode.current.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanFailure
            );
        } catch (err) {
            setError(`Error al iniciar la cámara: ${err.message}`);
            setIsScanning(false);
        }
    };

    // Detener el escaneo
    const stopScanning = async () => {
        if (html5QrCode.current && isScanning) {
            try {
                await html5QrCode.current.stop();
                html5QrCode.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error('Error al detener el escáner:', err);
            }
        }
    };

    const onScanSuccess = (decodedText) => {
        validateAndSetUrl(decodedText);
    };

    const onScanFailure = (error) => {
        console.debug('Scan failure:', error);
    };

    // Validar y establecer la URL
    const validateAndSetUrl = (url) => {
        try {
            new URL(url);
            setApiUrl(url);
            localStorage.setItem('ngrokApiUrl', url);
            setError('');
            showSavedIndicator();
            stopScanning();
        } catch (e) {
            setError('URL inválida');
        }
    };

    const showSavedIndicator = () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    // Manejar el bypass de Ngrok
    const handleBypass = () => {
        if (!apiUrl) {
            setError('Por favor, ingrese una URL válida primero');
            return;
        }
        setShowBypassModal(true);
    };

    // Iniciar el proceso de bypass
    const initiateBypass = () => {
        window.open(apiUrl, '_blank');
        setShowBypassModal(false);
    };

    useEffect(() => {
        const savedUrl = localStorage.getItem('ngrokApiUrl');
        if (savedUrl) {
            setApiUrl(savedUrl);
        }
    }, []);

    useEffect(() => {
        if (inputMethod === 'camera' && isOpen) {
            startRealTimeScanning();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [inputMethod, isOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
                setIsOpen(false);
                stopScanning();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setApiUrl(url);
        try {
            new URL(url);
            localStorage.setItem('ngrokApiUrl', url);
            setError('');
            showSavedIndicator();
        } catch (e) {
            setError('URL inválida');
        }
    };

    const InputMethodButton = ({ icon: Icon, method, label }) => (
        <button
            onClick={() => setInputMethod(method)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${inputMethod === method
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
        >
            <Icon size={24} className="mb-2" />
            <span className="text-sm">{label}</span>
        </button>
    );

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full p-2 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
                <Settings size={24} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-end md:relative md:inset-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    <div
                        ref={settingsPanelRef}
                        className="relative w-full md:w-96 mt-16 md:mt-2 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-gray-800 rounded-t-xl md:rounded-xl shadow-lg border border-gray-700">
                            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-white">Configuración API</h3>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            stopScanning();
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-6">
                                {/* Campo de URL */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        URL de la API
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={apiUrl}
                                            onChange={handleUrlChange}
                                            className={`w-full bg-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 ${error ? 'border-red-500' : 'border-gray-600'
                                                }`}
                                            placeholder="https://tu-api.ngrok-free.app"
                                        />
                                        {isSaved && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <Check className="text-green-500" size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botones de método de entrada */}
                                <div className="grid grid-cols-2 gap-4">
                                    <InputMethodButton
                                        icon={Keyboard}
                                        method="manual"
                                        label="Manual"
                                    />
                                    <InputMethodButton
                                        icon={Camera}
                                        method="camera"
                                        label="Cámara"
                                    />
                                </div>

                                {/* Área de cámara */}
                                {inputMethod === 'camera' && (
                                    <div className="space-y-2">
                                        <div
                                            id="qr-reader"
                                            className="bg-gray-700 rounded-lg overflow-hidden w-full aspect-square"
                                        />
                                        <p className="text-sm text-gray-400">
                                            Apunta la cámara al código QR
                                        </p>
                                    </div>
                                )}

                                {/* Mensajes de error */}
                                {error && (
                                    <p className="text-sm text-red-400">
                                        {error}
                                    </p>
                                )}

                                {/* Botón de Bypass */}
                                <button
                                    onClick={handleBypass}
                                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Confirmar e iniciar Bypass de Ngrok
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Bypass */}
            {showBypassModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    {/* Fondo con desenfoque */}
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Contenedor del modal */}
                    <div className="relative bg-gray-900 p-6 rounded-2xl shadow-xl max-w-sm sm:max-w-md w-full">
                        {/* Título */}
                        <h3 className="text-xl font-semibold text-white mb-3 text-center">
                            Bypass de Ngrok
                        </h3>

                        {/* Contenido del modal */}
                        <p className="text-gray-300 text-sm leading-relaxed text-center">
                            Debe hacer exactamente esto completar el Bypass:
                        </p>

                        {/* Lista de pasos con iconos */}
                        <ul className="mt-4 space-y-3 text-gray-300 text-sm">
                            <li className="flex items-start gap-2">
                                1. <span>Se abrirá una nueva pestaña con la URL de Ngrok pegada. Haga click en <strong>"Visit site"</strong> cuando aparezca.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                2. <span>Mantenga esa pestaña abierta.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                3. <span>Regrese a esta ventana para continuar usando ChatsitoGPT.</span>
                            </li>
                        </ul>

                        {/* Nota adicional */}
                        <p className="mt-4 text-xs text-gray-400 text-center">
                            Sencillo, ¿verdad?
                        </p>

                        {/* Botón de acción */}
                        <button
                            onClick={initiateBypass}
                            className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                            OK, Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}