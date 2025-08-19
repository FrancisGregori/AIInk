import { useJobs } from '@/contexts/JobContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Link } from 'wouter';

export default function JobNotification() {
  const { activeJobs, removeJob } = useJobs();

  // Don't show if no active jobs
  if (activeJobs.length === 0) return null;

  const processingJobs = activeJobs.filter(job => job.status === 'processing');
  const completedJobs = activeJobs.filter(job => job.status === 'completed');
  const failedJobs = activeJobs.filter(job => job.status === 'failed');

  return (
    <div className="fixed bottom-4 right-4 max-w-sm space-y-2 z-50">
      {/* Processing Jobs */}
      {processingJobs.map(job => (
        <Card key={job.id} className="bg-blue-950/90 border-blue-800 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-blue-100">
                    {job.type === 'stencil' ? 'Stencil' : 'Diseño'} procesando...
                  </p>
                  <p className="text-xs text-blue-300">{job.style || job.prompt?.slice(0, 30) || 'Sin título'}</p>
                </div>
              </div>
              <Link href={job.type === 'stencil' ? '/stencil-tool' : '/design-editor'}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Eye className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Completed Jobs */}
      {completedJobs.map(job => (
        <Card key={job.id} className="bg-green-950/90 border-green-800 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-100">
                    {job.type === 'stencil' ? 'Stencil' : 'Diseño'} completado
                  </p>
                  <p className="text-xs text-green-300">{job.style || job.prompt?.slice(0, 30) || 'Sin título'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Link href={job.type === 'stencil' ? '/stencil-tool' : '/design-editor'}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => removeJob(job.id)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Failed Jobs */}
      {failedJobs.map(job => (
        <Card key={job.id} className="bg-red-950/90 border-red-800 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-100">
                    Error en {job.type === 'stencil' ? 'stencil' : 'diseño'}
                  </p>
                  <p className="text-xs text-red-300">{job.errorMessage || 'Error desconocido'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => removeJob(job.id)}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}