import { upload } from '@vercel/blob/client';
import { useState, useRef } from 'react';
import { FaUpload, FaSpinner } from 'react-icons/fa';

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    onError?: (error: string) => void;
    className?: string;
    buttonText?: string;
}

export default function ImageUpload({ onUploadComplete, onError, className = '', buttonText = 'Bild hochladen' }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            onUploadComplete(newBlob.url);
        } catch (error) {
            console.error("Upload error:", error);
            if (onError) onError("Fehler beim Hochladen des Bildes.");
            else alert("Fehler beim Hochladen des Bildes.");
        } finally {
            setIsUploading(false);
            if (inputFileRef.current) {
                inputFileRef.current.value = "";
            }
        }
    };

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <input 
                type="file" 
                ref={inputFileRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
            <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
                {isUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                {isUploading ? 'Lädt hoch...' : buttonText}
            </button>
        </div>
    );
}
