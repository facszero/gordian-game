const installButton=document.querySelector('#install-app');
const updateButton=document.querySelector('#update-app');
const status=document.querySelector('#app-status');
let installPrompt, registration, refreshing=false;
const standalone=()=>matchMedia('(display-mode: standalone)').matches;
installButton.hidden=standalone();
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=false;});
installButton.addEventListener('click',async()=>{
  if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}
  else status.textContent='En Chrome para Android: menú ⋮ → Añadir a pantalla de inicio → Instalar. Si aún no aparece, espera a que termine la carga.';
});
window.addEventListener('appinstalled',()=>{installButton.hidden=true;status.textContent='Gordian instalado. Abre el juego desde su icono.';});
updateButton.addEventListener('click',()=>{if(registration?.waiting){status.textContent='Actualizando…';registration.waiting.postMessage({type:'SKIP_WAITING'});}});
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload();});
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    registration=reg;
    const ready=()=>{if(reg.waiting){updateButton.hidden=false;status.textContent='Nueva versión disponible. Actualízala desde este menú.';}};
    ready();
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){ready();if(!navigator.serviceWorker.controller)status.textContent='Juego descargado: listo para abrir sin conexión.';}});});
    navigator.serviceWorker.ready.then(()=>{if(!reg.waiting)status.textContent='Juego disponible sin conexión. El progreso se guarda en este dispositivo.';});
  }).catch(()=>{status.textContent='Puedes jugar en línea. La descarga para jugar sin conexión no se completó.';});
}
