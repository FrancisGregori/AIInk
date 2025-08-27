import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { tipsData } from "@/tips-data";

export default function Tips() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Volver al Generador' : 'Back to Generator'}
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {language === 'es' ? 'Guía de Prompts' : 'Prompt Guide'}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {language === 'es' 
              ? 'Aprende a crear prompts efectivos para obtener los mejores resultados con tu generador de imágenes. Estos consejos te ayudarán a transformar tus ideas en imágenes impresionantes.'
              : 'Learn to create effective prompts to get the best results from your image generator. These tips will help you transform your ideas into stunning images.'
            }
          </p>
          <p className="text-lg text-blue-300 mt-4 font-medium">
            {language === 'es' 
              ? '💡 Consejo: Los prompts en inglés producen mejores resultados'
              : '💡 Tip: English prompts produce better results'
            }
          </p>
        </div>

        <div className="grid gap-8 md:gap-12">
          {tipsData.map((tip) => {
            const IconComponent = tip.icon;
            return (
              <Card key={tip.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {tip.category[language]}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-slate-100">{tip.title[language]}</CardTitle>
                  <CardDescription className="text-slate-300 text-lg">
                    {tip.description[language]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-3">
                      {language === 'es' ? 'Técnicas:' : 'Techniques:'}
                    </h4>
                    <ul className="space-y-2">
                      {tip.content[language].map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-300">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-3">
                      {language === 'es' ? 'Ejemplos de Prompts:' : 'Example Prompts:'}
                    </h4>
                    <div className="space-y-2">
                      {tip.examples[language].map((example, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                          <code className="text-green-300 font-mono text-sm">{example}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-500/20 to-slate-600/20 border-blue-500/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                {language === 'es' ? '¿Necesitas Más Ayuda?' : 'Need More Help?'}
              </h3>
              <p className="text-slate-300 text-lg">
                {language === 'es' 
                  ? 'Experimenta con diferentes combinaciones y recuerda que la práctica hace al maestro. ¡Cada imagen es una oportunidad de aprender!'
                  : 'Experiment with different combinations and remember that practice makes perfect. Every image is an opportunity to learn!'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
