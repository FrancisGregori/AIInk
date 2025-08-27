import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Language = 'es' | 'en';

export const translations = {
  es: {
    title: 'Generador de Diseños de Tatuajes',
    subtitle: 'Transforma tus ideas en arte profesional',
    poweredBy: 'Impulsado por FLUX Kontext Max AI',
    generateButton: 'Generar Imagen',
    uploading: 'Subiendo...',
    generating: 'Generando...',
    face_poses: 'Poses Faciales',
    expressions: 'Expresiones',
    camera_angles: 'Ángulos de Cámara',
    art_styles: 'Estilos Artísticos',
    tattoo_styles: 'Estilos de Tatuajes',
    front: 'Frontal',
    leftTurn: 'Giro Izquierda',
    rightTurn: 'Giro Derecha',
    profile: 'Perfil',
    threeQuarter: 'Vista 3/4',
    lookUp: 'Mirar Arriba',
    lookDown: 'Mirar Abajo',
    overShoulder: 'Sobre Hombro',
    dramatic: 'Dramático',
    chinOnHand: 'Barbilla en Mano',
    dreamy: 'Soñador',
    dynamic: 'Dinámico',
    prompt: 'Descripción del diseño',
    promptPlaceholder: 'Describe tu diseño de tatuaje...',
    referenceImage: 'Imagen de Referencia',
    uploadImage: 'Subir Imagen',
    dragDrop: 'Arrastra una imagen aquí o',
    selectFile: 'selecciona archivo',
    noImages: 'No hay imágenes generadas aún',
    generatedAt: 'Generado el',
    download: 'Descargar',
    share: 'Compartir',
    useAsReference: 'Usar como Referencia',
    delete: 'Eliminar',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    settings: 'Configuración',
    uploadSuccess: 'Imagen subida exitosamente',
    uploadError: 'Error al subir imagen',
    generateSuccess: 'Imagen generada exitosamente',
    generateError: 'Error al generar imagen',
    copySuccess: 'Enlace copiado al portapapeles',
    deleteSuccess: 'Imagen eliminada',
    deleteError: 'Error al eliminar imagen',
  },
  en: {
    title: 'Tattoo Design Generator',
    subtitle: 'Transform your ideas into professional art',
    poweredBy: 'Powered by FLUX Kontext Max AI',
    generateButton: 'Generate Image',
    uploading: 'Uploading...',
    generating: 'Generating...',
    face_poses: 'Face Poses',
    expressions: 'Expressions',
    camera_angles: 'Camera Angles',
    art_styles: 'Art Styles',
    tattoo_styles: 'Tattoo Styles',
    front: 'Front',
    leftTurn: 'Left Turn',
    rightTurn: 'Right Turn',
    profile: 'Profile',
    threeQuarter: '3/4 View',
    lookUp: 'Look Up',
    lookDown: 'Look Down',
    overShoulder: 'Over Shoulder',
    dramatic: 'Dramatic',
    chinOnHand: 'Chin on Hand',
    dreamy: 'Dreamy',
    dynamic: 'Dynamic',
    prompt: 'Design description',
    promptPlaceholder: 'Describe your tattoo design...',
    referenceImage: 'Reference Image',
    uploadImage: 'Upload Image',
    dragDrop: 'Drag an image here or',
    selectFile: 'select file',
    noImages: 'No images generated yet',
    generatedAt: 'Generated on',
    download: 'Download',
    share: 'Share',
    useAsReference: 'Use as Reference',
    delete: 'Delete',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    settings: 'Settings',
    uploadSuccess: 'Image uploaded successfully',
    uploadError: 'Error uploading image',
    generateSuccess: 'Image generated successfully',
    generateError: 'Error generating image',
    copySuccess: 'Link copied to clipboard',
    deleteSuccess: 'Image deleted',
    deleteError: 'Error deleting image',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[language] as Record<string, string>;
    return translation[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
