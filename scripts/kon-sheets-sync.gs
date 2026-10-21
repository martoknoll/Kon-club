/**
 * KON CLUB — Sincronización con FECHAS (Google Apps Script)
 * Pegá este archivo en Extensiones > Apps Script de "Kon Club: FECHAS".
 *
 * CONFIGURACIÓN:
 * 1. En "Configuración del proyecto > Propiedades de secuencia de comandos",
 *    guardar KON_SYNC_TOKEN con el token generado por el panel de Kon Club.
 * 2. Ejecutar "setupKonSync" una sola vez y autorizar los permisos.
 * 3. NO publicar este script como web app; funciona solo en la planilla.
 *
 * Las columnas originales A:F y los cálculos H:J no se modifican, excepto
 * cuando se agregan compras nuevas o se reflejan importes verificados.
 * Columnas nuevas reservadas: L-Q. El script no toca filas históricas sin ID.
 *
 * Para gestionar cupos compartidos, además informa SOLO las cantidades totales
 * de las filas del formulario anterior (sin enviar nombres ni emails a Supabase).
 * El checkout se bloquea si el reporte tiene más de 12 minutos o los cupos
 * definitivos no están configurados. Las ventas NO se activan desde este script.
 */
const KON_SYNC = Object.freeze({
  api: 'https://ogrzuiwlyfobhtknjuzu.supabase.co/functions/v1/kon-tickets',
  spreadsheetId: '1DZ_yhLnzOVMHhBhsI_3x2QlLzcKcceDddyCjDDbGC7o',
  sheetName: 'KON CLUB: (Alimme) - Casa Lobo & Rocky Horror',
  header: ['ID_PEDIDO', 'EMAIL', 'ESTADO', 'ORIGEN', 'ULTIMO_CAMBIO', 'CODIGO'],
  states: ['PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'CORTESIA', 'CANCELADO']
});
function konToken_(){
  const token=PropertiesService.getScriptProperties().getProperty('KON_SYNC_TOKEN');
  if(!token||!(/^[0-9a-f]{64}$/.test(token)))throw new Error('Configurá KON_SYNC_TOKEN en Propiedades de secuencia de comandos.');
  return token;
}
function konSheet_(){
  const sheet=SpreadsheetApp.openById(KON_SYNC.spreadsheetId).getSheetByName(KON_SYNC.sheetName);
  if(!sheet)throw new Error('No encuentro la pestaña: '+KON_SYNC.sheetName);
  return sheet;
}
function konApi_(route,payload){
  const options={
    method:payload?'post':'get',
    headers:{'x-kon-sheet-token':konToken_()},
    contentType:'application/json',
    muteHttpExceptions:true
  };
  if(payload) options.payload=JSON.stringify(payload);
  const response=UrlFetchApp.fetch(KON_SYNC.api+'/'+route,options);
  let data={};
  try{data=JSON.parse(response.getContentText())}catch(e){}
  if(response.getResponseCode()>=300||!data.ok){
    throw new Error('Kon API /'+route+' ('+response.getResponseCode()+'): '+(data.error||'Error desconocido'));
  }
  return data;
}
function onOpen(){
  SpreadsheetApp.getUi().createMenu('KON CLUB')
    .addItem('Sincronizar pedidos web ahora','syncKonToSheet')
    .addItem('Actualizar cupos de formulario anterior','syncLegacyInventoryKon')
    .addItem('Verificar configuración','checkKonSync')
    .addToUi();
}
function checkKonSync(){
  const data=konApi_('sync-export');
  SpreadsheetApp.getUi().alert('Conexión OK. Pedidos visibles: '+data.orders.length+'.\nNo se modificaron filas.');
}
function setupKonSync(){
  const data=konApi_('sync-export');
  if(data.tab_title!==KON_SYNC.sheetName)throw new Error('El destino en Supabase no coincide con esta pestaña.');
  const sheet=konSheet_();
  const range=sheet.getRange(1,12,1,6);
  const current=range.getValues()[0];
  const safe=current.every((v,i)=>!v||String(v)===KON_SYNC.header[i]);
  if(!safe)throw new Error('L1:Q1 ya contienen datos. No se tocaron; revisá dónde ubicar metadatos.');
  range.setValues([KON_SYNC.header]);
  range.setFontWeight('bold');
  const spreadsheet=SpreadsheetApp.openById(KON_SYNC.spreadsheetId);
  const triggers=ScriptApp.getProjectTriggers();
  if(!triggers.some(t=>t.getHandlerFunction()==='konOnEdit')){
    ScriptApp.newTrigger('konOnEdit').forSpreadsheet(spreadsheet).onEdit().create();
  }
  if(!triggers.some(t=>t.getHandlerFunction()==='syncKonToSheet')){
    ScriptApp.newTrigger('syncKonToSheet').timeBased().everyMinutes(5).create();
  }
  if(!triggers.some(t=>t.getHandlerFunction()==='konOnSheetChange')){
    ScriptApp.newTrigger('konOnSheetChange').forSpreadsheet(spreadsheet).onChange().create();
  }
  if(!triggers.some(t=>t.getHandlerFunction()==='konOnFormSubmit')){
    ScriptApp.newTrigger('konOnFormSubmit').forSpreadsheet(spreadsheet).onFormSubmit().create();
  }
  syncKonToSheet();
}
function konSafeText_(input){
  const s=String(input||'');
  // Prevent CSV/Sheets formula injection from buyer-provided text.
  return /^[=+\-@\t\r\n]/.test(s.trimStart()) ? "'"+s : s;
}
// Lee solo cantidades de filas históricas SIN ID_PEDIDO (columna L).
// Las filas web no se cuentan aquí, porque Supabase ya reserva sus productos.
function konLegacyCounts_(sheet){
  const rows=sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),14).getValues();
  const counts={general:0,post:0,fanzine:0,legacy_rows:0};
  function qty(value,row,label){
    if(value===null||value===undefined||String(value).trim()==='')return 0;
    const v=typeof value==='number'?value:Number(String(value).trim());
    if(!Number.isInteger(v)||v<0||v>100){
      throw new Error('Cantidad inválida en fila '+row+', columna '+label+'. No se actualizaron cupos.');
    }
    return v;
  }
  rows.forEach((r,i)=>{
    const name=String(r[0]||'').trim();
    if(!name)return;
    // Metadata L (12): la fila ya vino del checkout web y cuenta en kon_order_lines.
    if(String(r[11]||'').trim())return;
    // Solo se excluyen cancelaciones explícitas, no registros sin pago.
    const state=String(r[13]||'').trim().toUpperCase();
    if(state==='CANCELADO'||state==='RECHAZADO')return;
    counts.legacy_rows++;
    counts.general+=qty(r[1],i+2,'B (GENERAL)');
    counts.post+=qty(r[2],i+2,'C (POST)');
    counts.fanzine+=qty(r[3],i+2,'D (FANZINE)');
  });
  return counts;
}
function konReportLegacyInventory_(sheet){
  // Este reporte NO contiene información personal de los compradores.
  const counts=konLegacyCounts_(sheet||konSheet_());
  konApi_('sync-inventory',counts);
  Logger.log('Cupos formulario anterior informados: general='+counts.general+
    ', post='+counts.post+', fanzine='+counts.fanzine+
    ', registros='+counts.legacy_rows);
}
function syncLegacyInventoryKon(){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(20000))throw new Error('Hay otra sincronización en proceso. Reintentá en unos segundos.');
  try{konReportLegacyInventory_(konSheet_())}
  finally{lock.releaseLock();}
}
function konOnFormSubmit(e){
  if(!e||!e.range||e.range.getSheet().getName()!==KON_SYNC.sheetName)return;
  // Cuando el formulario anterior vuelca directamente en FECHAS.
  syncLegacyInventoryKon();
}
function konOnSheetChange(e){
  // Las respuestas de Google Forms no siempre lanzan onEdit.
  // Detectar inserciones y mantener en paralelo el trigger cada cinco minutos.
  if(!e||!['INSERT_ROW','REMOVE_ROW','EDIT'].includes(String(e.changeType||'')))return;
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(1500))return;
  try{konReportLegacyInventory_(konSheet_())}
  finally{lock.releaseLock();}
}
function syncKonToSheet(){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(25000))return;
  try{
    const data=konApi_('sync-export');
    if(data.tab_title!==KON_SYNC.sheetName)throw new Error('La pestaña configurada no coincide.');
    const sheet=konSheet_();
    const last=Math.max(sheet.getLastRow(),2);
    const names=sheet.getRange(2,1,last-1,1).getValues();
    const storedIds=sheet.getRange(2,12,last-1,1).getValues();
    const map={};
    storedIds.forEach((r,i)=>{if(r[0])map[String(r[0])]=i+2;});
    let finalRow=1;
    names.forEach((r,i)=>{if(String(r[0]||'').trim())finalRow=i+2;});
    (data.orders||[]).forEach(order=>{
      if(!order.id)return;
      let row=map[String(order.id)];
      if(!row){
        row=++finalRow;
        // Respeta las columnas estadísticas H:J y las entradas previas A:F.
        sheet.getRange(row,1,1,6).setValues([[
          konSafeText_(order.name),order.general||'',order.post||'',order.fanzine||'','',
          'WEB · '+order.code
        ]]);
        sheet.getRange(row,12,1,6).setValues([[
          order.id,konSafeText_(order.email),'PENDIENTE','WEB',new Date(),order.code
        ]]);
        map[order.id]=row;
      }
      if(order.sheet_row_key!==KON_SYNC.sheetName+':'+String(row)){
        konApi_('sync-ack',{order_id:order.id,row:row});
      }
      let changed=false;
      const newState=konStatus_(order.status);
      const current=String(sheet.getRange(row,14).getValue()||'').toUpperCase().trim();
      if(current!==newState){sheet.getRange(row,14).setValue(newState);changed=true;}
      if((order.status==='verified'||order.status==='courtesy')&&order.received!==null){
        const payment=sheet.getRange(row,5);
        if(konAmount_(payment.getValue())!==Number(order.received)){
          payment.setValue(Number(order.received));changed=true;
        }
      }
      if(changed)sheet.getRange(row,16).setValue(new Date());
    });
    // Solo después de consolidar los pedidos web, recalcular las filas antiguas.
    konReportLegacyInventory_(sheet);
  }finally{lock.releaseLock();}
}
function konStatus_(value){
  return ({pending:'PENDIENTE',verified:'VERIFICADO',rejected:'RECHAZADO',cancelled:'CANCELADO',courtesy:'CORTESIA'})[value]||'PENDIENTE';
}
function konAmount_(value){
  if(typeof value==='number')return Math.round(value);
  const clean=String(value||'').trim().replace(/[^0-9,.-]/g,'');
  if(!clean)return null;
  // Currency formatted for Argentina, e.g. "$18.000" or "$18.000,00".
  const norm=clean.replace(/\./g,'').replace(',','.');
  const result=Number(norm);
  return Number.isFinite(result)?Math.round(result):null;
}
function konOnEdit(e){
  if(!e||!e.range)return;
  const range=e.range;
  if(range.getSheet().getName()!==KON_SYNC.sheetName)return;
  if(range.getRow()>=2&&range.getColumn()<=4){
    // Cambios manuales en nombres/cantidades de una fila del formulario viejo.
    const lock=LockService.getScriptLock();
    if(!lock.tryLock(1500))return;
    try{konReportLegacyInventory_(range.getSheet())}
    finally{lock.releaseLock();}
    return;
  }
  if(range.getColumn()!==14||range.getRow()<2||range.getNumRows()!==1)return;
  const target=String(range.getValue()||'').trim().toUpperCase();
  if(!KON_SYNC.states.includes(target))return;
  if(target==='PENDIENTE')return; // No reiniciar aprobaciones sin revisión.
  const row=range.getRow();
  const sheet=range.getSheet();
  const orderId=String(sheet.getRange(row,12).getValue()||'').trim();
  if(!orderId)return; // Registro histórico/manual sin ID web: sin sincronización automática.
  const amount=konAmount_(sheet.getRange(row,5).getValue());
  if(target==='VERIFICADO'&&amount===null){
    range.setValue(e.oldValue||'PENDIENTE');
    range.setNote('Completá primero el importe acreditado en la columna PAGO.');
    return;
  }
  let actor='';
  try{actor=e.user?.getEmail()||Session.getActiveUser().getEmail()||'';}catch(err){}
  const map={VERIFICADO:'verified',RECHAZADO:'rejected',CORTESIA:'courtesy',CANCELADO:'cancelled'};
  try{
    konApi_('sync-review',{
      order_id:orderId,status:map[target],
      amount_received_ars:target==='VERIFICADO'?amount:null,
      bank_checked:target==='VERIFICADO',
      actor_email:actor,
      note:String(sheet.getRange(row,6).getValue()||'').slice(0,500)
    });
    range.clearNote();
  }catch(err){
    range.setValue(e.oldValue||'PENDIENTE');
    range.setNote('No se sincronizó con Kon Club: '+String(err.message||err));
    console.error(err);
  }
}
