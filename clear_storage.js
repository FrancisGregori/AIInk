// Script para limpiar localStorage desde consola del navegador
if (typeof localStorage !== 'undefined') {
  console.log('Clearing localStorage...');
  localStorage.removeItem('tattoo-stencil-jobs');
  localStorage.removeItem('tattoostencilpro_design_jobs');
  localStorage.removeItem('tattoostencilpro_stencil_jobs');
  console.log('LocalStorage cleared successfully');
}
