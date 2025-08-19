import { Users, Lightbulb, Camera, Palette, Zap, Eye } from "lucide-react";

export interface TipData {
  id: number;
  category: {
    es: string;
    en: string;
  };
  icon: any;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  content: {
    es: string[];
    en: string[];
  };
  examples: {
    es: string[];
    en: string[];
  };
}

export const tipsData: TipData[] = [
  {
    id: 1,
    category: {
      es: 'Cambio de Poses',
      en: 'Pose Changes'
    },
    icon: Users,
    title: {
      es: 'Cómo Cambiar Poses de Rostros',
      en: 'How to Change Face Poses'
    },
    description: {
      es: 'Técnicas efectivas para modificar la posición y orientación del rostro',
      en: 'Effective techniques to modify face position and orientation'
    },
    content: {
      es: [
        'Usa direcciones específicas en inglés: "Turn head slightly to the left", "Look over shoulder"',
        'Especifica ángulos: "45-degree angle", "three-quarter view", "profile view"',
        'Combina con expresiones: "Turn left while smiling", "Look down pensively"',
        'Mantén consistencia: Agrega "preserve original lighting" si solo quieres cambiar pose',
        'Recuerda: Los prompts en inglés dan mejores resultados'
      ],
      en: [
        'Use specific directions: "Turn head slightly to the left", "Look over shoulder"',
        'Specify angles: "45-degree angle", "three-quarter view", "profile view"',
        'Combine with expressions: "Turn left while smiling", "Look down pensively"',
        'Maintain consistency: Add "preserve original lighting" if you only want to change pose',
        'Remember: English prompts yield better results'
      ]
    },
    examples: {
      es: [
        '"Turn head slightly to the left"',
        '"Three-quarter view looking upward"',
        '"Full profile with serious expression"'
      ],
      en: [
        '"Turn head slightly to the left"',
        '"Three-quarter view looking upward"',
        '"Full profile with serious expression"'
      ]
    }
  },
  {
    id: 2,
    category: {
      es: 'Iluminación',
      en: 'Lighting'
    },
    icon: Lightbulb,
    title: {
      es: 'Técnicas de Iluminación Profesional',
      en: 'Professional Lighting Techniques'
    },
    description: {
      es: 'Configura iluminación como un fotógrafo profesional',
      en: 'Set up lighting like a professional photographer'
    },
    content: {
      es: [
        'Rembrandt lighting: "key light 45° high right, dramatic shadows"',
        'Butterfly lighting: "key light directly above, soft shadows under nose"',
        'Split lighting: "hard side light, half face in shadow"',
        'Rim lighting: "backlight from behind, creates outline glow"',
        'Importante: Usa estos términos en inglés para mejores resultados'
      ],
      en: [
        'Rembrandt lighting: "key light 45° high right, dramatic shadows"',
        'Butterfly lighting: "key light directly above, soft shadows under nose"',
        'Split lighting: "hard side light, half face in shadow"',
        'Rim lighting: "backlight from behind, creates outline glow"',
        'Important: Use these English terms for best results'
      ]
    },
    examples: {
      es: [
        '"Apply Rembrandt lighting with key 45° high right"',
        '"Soft butterfly light from above"',
        '"Blue rim light from behind left"'
      ],
      en: [
        '"Apply Rembrandt lighting with key 45° high right"',
        '"Soft butterfly light from above"',
        '"Blue rim light from behind left"'
      ]
    }
  },
  {
    id: 3,
    category: {
      es: 'Estilos Artísticos',
      en: 'Art Styles'
    },
    icon: Palette,
    title: {
      es: 'Transformaciones de Estilo',
      en: 'Style Transformations'
    },
    description: {
      es: 'Convierte tu imagen en diferentes estilos artísticos',
      en: 'Transform your image into different artistic styles'
    },
    content: {
      es: [
        'Especifica el medio en inglés: "oil painting", "pencil sketch", "watercolor"',
        'Menciona la técnica: "crosshatching", "soft shading", "visible brushstrokes"',
        'Añade referencias artísticas: "Renaissance style", "Art Nouveau", "hyperrealistic"',
        'Combina estilos: "charcoal sketch with digital enhancement"',
        'Nota: Los términos artísticos en inglés son más precisos'
      ],
      en: [
        'Specify the medium: "oil painting", "pencil sketch", "watercolor"',
        'Mention technique: "crosshatching", "soft shading", "visible brushstrokes"',
        'Add artistic references: "Renaissance style", "Art Nouveau", "hyperrealistic"',
        'Combine styles: "charcoal sketch with digital enhancement"',
        'Note: English artistic terms are more precise'
      ]
    },
    examples: {
      es: [
        '"Convert to oil painting with visible brushstrokes"',
        '"Pencil drawing with detailed shading"',
        '"Art Nouveau style with organic lines"'
      ],
      en: [
        '"Convert to oil painting with visible brushstrokes"',
        '"Pencil drawing with detailed shading"',
        '"Art Nouveau style with organic lines"'
      ]
    }
  },
  {
    id: 4,
    category: {
      es: 'Expresiones',
      en: 'Expressions'
    },
    icon: Eye,
    title: {
      es: 'Control de Expresiones Faciales',
      en: 'Facial Expression Control'
    },
    description: {
      es: 'Modifica emociones y expresiones de manera natural',
      en: 'Modify emotions and expressions naturally'
    },
    content: {
      es: [
        'Sé específico con emociones en inglés: "gentle smile", "intense gaze", "contemplative look"',
        'Describe los ojos: "eyes looking directly at camera", "gazing upward", "closed eyes"',
        'Menciona micro-expresiones: "slight frown", "raised eyebrow", "subtle smirk"',
        'Combina con contexto: "confident expression for business portrait"',
        'Consejo: Las emociones se expresan mejor en inglés'
      ],
      en: [
        'Be specific with emotions: "gentle smile", "intense gaze", "contemplative look"',
        'Describe the eyes: "eyes looking directly at camera", "gazing upward", "closed eyes"',
        'Mention micro-expressions: "slight frown", "raised eyebrow", "subtle smirk"',
        'Combine with context: "confident expression for business portrait"',
        'Tip: Emotions are best expressed in English'
      ]
    },
    examples: {
      es: [
        '"Gentle smile with eyes looking at camera"',
        '"Thoughtful expression with slightly raised eyebrow"',
        '"Intense and confident gaze"'
      ],
      en: [
        '"Gentle smile with eyes looking at camera"',
        '"Thoughtful expression with slightly raised eyebrow"',
        '"Intense and confident gaze"'
      ]
    }
  },
  {
    id: 5,
    category: {
      es: 'Mejores Prácticas',
      en: 'Best Practices'
    },
    icon: Zap,
    title: {
      es: 'Consejos para Mejores Resultados',
      en: 'Tips for Better Results'
    },
    description: {
      es: 'Estrategias generales para obtener los mejores resultados',
      en: 'General strategies to get the best results'
    },
    content: {
      es: [
        'SIEMPRE usa inglés: Los prompts en inglés producen resultados superiores',
        'Sé específico: "soft natural lighting" es mejor que solo "good lighting"',
        'Menciona lo que NO quieres cambiar: "preserve original background"',
        'Experimenta gradualmente: Haz un cambio a la vez para resultados predecibles',
        'Usa términos técnicos en inglés: "shallow depth of field", "bokeh effect", "color grading"'
      ],
      en: [
        'ALWAYS use English: English prompts produce superior results',
        'Be specific: "soft natural lighting" is better than just "good lighting"',
        'Mention what NOT to change: "preserve original background"',
        'Experiment gradually: Make one change at a time for predictable results',
        'Use technical terms: "shallow depth of field", "bokeh effect", "color grading"'
      ]
    },
    examples: {
      es: [
        '"Soft natural lighting with shallow depth of field"',
        '"Preserve original pose and wardrobe"',
        '"Professional headshot with warm color grading"'
      ],
      en: [
        '"Soft natural lighting with shallow depth of field"',
        '"Preserve original pose and wardrobe"',
        '"Professional headshot with warm color grading"'
      ]
    }
  },
  {
    id: 6,
    category: {
      es: 'Fotografía',
      en: 'Photography'
    },
    icon: Camera,
    title: {
      es: 'Configuraciones de Cámara',
      en: 'Camera Settings'
    },
    description: {
      es: 'Simula diferentes configuraciones y efectos de cámara',
      en: 'Simulate different camera settings and effects'
    },
    content: {
      es: [
        'Profundidad de campo en inglés: "shallow/deep depth of field", "bokeh background"',
        'Tipo de lente: "wide angle", "telephoto", "macro lens effect"',
        'Configuraciones: "low light photography", "high contrast", "soft focus"',
        'Efectos de post-procesado: "color grading", "film grain", "vintage look"',
        'Fundamental: Todos estos términos funcionan mejor en inglés'
      ],
      en: [
        'Depth of field: "shallow/deep depth of field", "bokeh background"',
        'Lens type: "wide angle", "telephoto", "macro lens effect"',
        'Settings: "low light photography", "high contrast", "soft focus"',
        'Post-processing effects: "color grading", "film grain", "vintage look"',
        'Essential: All these terms work best in English'
      ]
    },
    examples: {
      es: [
        '"Soft bokeh effect in background"',
        '"Low light photography with film grain"',
        '"Wide angle lens with minimal distortion"'
      ],
      en: [
        '"Soft bokeh effect in background"',
        '"Low light photography with film grain"',
        '"Wide angle lens with minimal distortion"'
      ]
    }
  }
];

// Función para agregar nuevos tips fácilmente
export function addNewTip(tip: Omit<TipData, 'id'>): TipData {
  const newId = Math.max(...tipsData.map(t => t.id)) + 1;
  const newTip = { ...tip, id: newId };
  tipsData.push(newTip);
  return newTip;
}
