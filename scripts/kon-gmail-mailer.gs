/**
 * KON CLUB — Mailer transaccional independiente de Google Sheets.
 *
 * Pegá este archivo en un NUEVO proyecto independiente de Apps Script
 * creado DESDE konclub.entradas@gmail.com, no en el script de FECHAS.
 *
 * Proyecto > Propiedades de secuencia de comandos:
 *     KON_MAIL_TOKEN = token privado generado en panel -> CONFIGURAR EMAIL
 *
 * Funciones para ejecutar manualmente:
 *   1. verificarKonMail()  -> comprobación sin envíos.
 *   2. enviarPruebaKon()   -> envía UN ejemplo a konclub.entradas@gmail.com.
 *   3. enviarPruebaRecordatorioKon() -> envia UN ejemplo 24h a Gmail propio.
 *   4. instalarKonMail()  -> instala trigger de cinco minutos;
 *                           no envía correos reales hasta activar mail_settings.enabled.
 *
 * IMPORTANTE: no guardar tokens en GitHub ni compartirlos en chats.
 * El remitente es la cuenta que AUTORIZA este proyecto y sus triggers.
 */
const KON_MAIL=Object.freeze({
  api:'https://ogrzuiwlyfobhtknjuzu.supabase.co/functions/v1/kon-tickets',
  sender:'konclub.entradas@gmail.com',
  replyTo:'kon.club@proton.me',
  maxPerRun:10
});
function konMailToken_(){
  const token=PropertiesService.getScriptProperties().getProperty('KON_MAIL_TOKEN');
  if(!token||!(/^[a-f0-9]{64}$/.test(token))){
    throw new Error('Falta KON_MAIL_TOKEN en Configuración del proyecto > Propiedades de secuencia de comandos.');
  }
  return token;
}
function konMailSender_(){
  const actual=String(Session.getEffectiveUser().getEmail()||'').toLowerCase();
  if(actual!==KON_MAIL.sender){
    throw new Error('Cuenta equivocada: entrá en '+KON_MAIL.sender+' y autorizá ESTE proyecto desde esa cuenta. Cuenta actual: '+(actual||'desconocida'));
  }
}
function konMailApi_(route,payload){
  const options={
    method:payload?'post':'get',
    headers:{'x-kon-mail-token':konMailToken_()},
    contentType:'application/json',
    muteHttpExceptions:true
  };
  if(payload)options.payload=JSON.stringify(payload);
  const response=UrlFetchApp.fetch(KON_MAIL.api+'/'+route,options);
  let data={};
  try{data=JSON.parse(response.getContentText())}catch(e){}
  if(response.getResponseCode()>=300||!data.ok){
    throw new Error('Kon Mail /'+route+' ('+response.getResponseCode()+'): '+(data.error||'sin detalles'));
  }
  return data;
}
function verificarKonMail(){
  konMailSender_();
  const response=konMailApi_('mail-ping');
  if(response.sender!==KON_MAIL.sender||response.reply_to!==KON_MAIL.replyTo){
    throw new Error('El remitente o la dirección de respuesta no coinciden con la configuración.');
  }
  Logger.log('Conexión OK. Remitente: '+response.sender+
    '. Respuestas: '+response.reply_to+
    '. Correos a compradores reales: '+(response.enabled?'ACTIVADOS':'DESACTIVADOS')+'.');
}
/**
 * ENVÍA 1 mensaje A NOSOTROS MISMOS. No activa ventas ni el mailer real.
 * Confirmar que la cuenta autorizada sea konclub.entradas@gmail.com.
 */
function enviarPruebaKon(){
  konMailSender_();
  const api=konMailApi_('mail-preview?kind=received');
  if(api.to!==KON_MAIL.sender || !api.subject.startsWith('[PRUEBA')){
    throw new Error('No se puede enviar: el destinatario o asunto de prueba es incorrecto.');
  }
  if(MailApp.getRemainingDailyQuota()<1){
    throw new Error('La cuota de Gmail para hoy se agotó.');
  }
  MailApp.sendEmail({
    to:api.to,subject:api.subject,body:api.text,htmlBody:api.html,
    name:'Kon Club',replyTo:KON_MAIL.replyTo
  });
  Logger.log('Enviada 1 prueba a '+KON_MAIL.sender+
    '. Revisá Recibidos y Spam; no se avisó a asistentes.');
}
/**
 * Envía SOLO a la misma cuenta del club un ejemplo con el flyer real del evento.
 * NO programa recordatorios ni envía mails a asistentes.
 */
function enviarPruebaRecordatorioKon(){
  konMailSender_();
  const api=konMailApi_('mail-preview?kind=reminder');
  if(api.to!==KON_MAIL.sender||!api.subject.startsWith('[PRUEBA')){
    throw new Error('Destino inválido para el email de recordatorio.');
  }
  if(MailApp.getRemainingDailyQuota()<1){
    throw new Error('No queda cuota de Gmail para enviar la prueba.');
  }
  MailApp.sendEmail({
    to:KON_MAIL.sender,
    subject:api.subject,
    body:api.text,
    htmlBody:api.html,
    name:'Kon Club',
    replyTo:KON_MAIL.replyTo
  });
  Logger.log('Recordatorio ficticio enviado al propio Gmail del club. No se activaron recordatorios reales.');
}
function instalarKonMail(){
  verificarKonMail();
  const triggers=ScriptApp.getProjectTriggers();
  if(!triggers.some(t=>t.getHandlerFunction()==='procesarColaKon')){
    ScriptApp.newTrigger('procesarColaKon').timeBased().everyMinutes(5).create();
  }
  Logger.log('Trigger de correo instalado. El envío real sigue controlado por Supabase.');
}
/**
 * Corre cada 5 minutos. Mientras enabled=false, no envía correos.
 * El endpoint mail-next solo genera recordatorios cuando reminders_enabled=true
 * y se aprobó explícitamente la fecha de la edición.
 * No hace reintentos automáticos de envíos que hayan quedado inciertos,
 * para no duplicar confirmaciones.
 */
function procesarColaKon(){
  konMailSender_();
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))return;
  try{
    const status=konMailApi_('mail-ping');
    if(!status.enabled){
      Logger.log('Envíos de compradores desactivados. No se envió ningún correo.');
      return;
    }
    const remaining=MailApp.getRemainingDailyQuota();
    if(remaining<1){
      Logger.log('Cuota diaria agotada. Pausado sin reclamar correos.');
      return;
    }
    for(let n=0;n<Math.min(remaining,KON_MAIL.maxPerRun);n++){
      const data=konMailApi_('mail-next');
      if(!data.enabled||!data.mail)break;
      const mail=data.mail;
      if(!/^[0-9a-f-]{36}$/i.test(mail.id)||
         !/^[a-f0-9]{64}$/.test(mail.claim_token)||
         !['received','verified','courtesy','reminder'].includes(mail.kind)||
         typeof mail.to!=='string'||!mail.to.includes('@')||
         /@example\.(invalid|test)$/i.test(mail.to)||
         typeof mail.subject!=='string'||typeof mail.text!=='string'){
        konMailApi_('mail-ack',{
          id:mail.id,claim_token:mail.claim_token,sent:false,
          error:'Invalid mail content, rejected safely'
        });
        throw new Error('Correo inválido rechazado sin enviar.');
      }
      let gmailAccepted=false;
      try{
        MailApp.sendEmail({
          to:mail.to,subject:mail.subject,body:mail.text,
          htmlBody:mail.html,name:'Kon Club',replyTo:KON_MAIL.replyTo
        });
        gmailAccepted=true;
        konMailApi_('mail-ack',{
          id:mail.id,claim_token:mail.claim_token,sent:true
        });
        Logger.log('Confirmación despachada correctamente; identificador interno: '+mail.id);
      }catch(err){
        if(gmailAccepted){
          // Gmail podría haber enviado. NUNCA reintentar automáticamente.
          throw new Error('Gmail aceptó el correo pero no se pudo registrar el acuse. Revisar manualmente: '+mail.id);
        }
        try{
          konMailApi_('mail-ack',{
            id:mail.id,claim_token:mail.claim_token,sent:false,
            error:String(err&&err.message||err).slice(0,300)
          });
        }catch(ackError){
          Logger.log('No se pudo registrar el error. Se mantiene bloqueado para revisión manual: '+mail.id);
        }
        throw err;
      }
    }
  }finally{
    lock.releaseLock();
  }
}
