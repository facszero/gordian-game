const installButton=document.querySelector('#install-app');
const updateButton=document.querySelector('#update-app');
const status=document.querySelector('#app-status');
let installPrompt, registration, refreshing=false, installMessage=false;
const standalone=()=>matchMedia('(display-mode: standalone)').matches;
installButton.hidden=standalone();
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=false;});
installButton.addEventListener('click',async()=>{
  installMessage=true;
  if(installPrompt){
    try{await installPrompt.prompt();const choice=await installPrompt.userChoice;
      status.textContent=choice.outcome==='accepted'?'Solicitud enviada a Android. Busca «Gordian» en la lista de aplicaciones; el icono puede tardar en aparecer.':'Instalación cancelada. Puedes seguir jugando en Chrome.';
    }catch{status.textContent='Chrome no pudo abrir la instalación. Prueba desde su menú ⋮ → Añadir a pantalla de inicio.';}
    installPrompt=null;
  }else status.textContent='En Chrome: menú ⋮ → Añadir a pantalla de inicio → Instalar. Si ya aceptaste, busca «Gordian» en la lista de aplicaciones o en Ajustes → Aplicaciones. Desde aquí no podemos comprobar el icono del teléfono.';
});
window.addEventListener('appinstalled',()=>{installMessage=true;installButton.hidden=true;status.textContent='Chrome aceptó la instalación. Busca «Gordian» en la lista de aplicaciones y arrastra su icono al inicio. Android puede tardar en completar este paso.';});
updateButton.addEventListener('click',()=>{if(registration?.waiting){status.textContent='Actualizando…';registration.waiting.postMessage({type:'SKIP_WAITING'});}});
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload();});
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    registration=reg;
    const ready=()=>{if(reg.waiting){updateButton.hidden=false;status.textContent='Nueva versión disponible. Actualízala desde este menú.';}};
    ready();
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){ready();if(!navigator.serviceWorker.controller&&!installMessage)status.textContent='Juego descargado: listo para abrir sin conexión.';}});});
    navigator.serviceWorker.ready.then(()=>{if(!reg.waiting&&!installMessage)status.textContent='Juego disponible sin conexión. El progreso se guarda en este dispositivo.';});
  }).catch(()=>{status.textContent='Puedes jugar en línea. La descarga para jugar sin conexión no se completó.';});
}
