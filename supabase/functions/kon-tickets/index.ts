import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { formatKonMail } from "./mail-template.js";

type JsonValue = Record<string, unknown>;
const url = Deno.env.get("SUPABASE_URL") || "";
const secrets = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secrets.default;
if (!url || !serviceKey) throw new Error("Missing Supabase runtime secrets");
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const acceptedOrigins = new Set([
  "https://kon-club.vercel.app",
  "https://kon-club-git-feature-checkout-1870e9-martoknoll-8366s-projects.vercel.app"
]);
function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && acceptedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-kon-mail-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}
function respond(data: JsonValue, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8" } });
}
function fail(message: string, status: number, origin: string | null) {
  return respond({ ok: false, error: message }, status, origin);
}
async function digest(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function adminFromRequest(req: Request) {
  const match = /^Bearer (.+)$/i.exec(req.headers.get("Authorization") || "");
  if (!match) return null;
  const { data: { user }, error } = await db.auth.getUser(match[1]);
  if (error || !user || !user.email) return null;
  // Email must have been verified by Supabase Auth; a typed email alone never grants access.
  if (!user.email_confirmed_at) return null;
  const { data: member, error: dbError } = await db.from("kon_allowed_editors")
    .select("email,google_role").eq("email", user.email.toLowerCase()).maybeSingle();
  if (dbError || !member) return null;
  return { id: user.id, email: user.email.toLowerCase() };
}
function validUuid(input: unknown): input is string {
  return typeof input === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
}
function readString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max + 1) : "";
}
const LIVE_SHEET_ID="1DZ_yhLnzOVMHhBhsI_3x2QlLzcKcceDddyCjDDbGC7o";
const INVENTORY_MAX_AGE_MS=12*60*1000;
function liveInventoryFresh(snapshot:JsonValue|null){
 return Boolean(snapshot?.last_synced_at&&
   Number.isFinite(new Date(String(snapshot.last_synced_at)).getTime())&&
   Date.now()-new Date(String(snapshot.last_synced_at)).getTime()>=0&&
   Date.now()-new Date(String(snapshot.last_synced_at)).getTime()<INVENTORY_MAX_AGE_MS);
}
async function getInventory(eventId:string){
 const {data,error}=await db.from("kon_legacy_inventory")
  .select("event_id,general_qty,post_qty,fanzine_qty,legacy_rows,last_synced_at,sync_source")
  .eq("event_id",eventId).maybeSingle();
 if(error)throw new Error("inventory_unavailable");
 return data;
}
async function updateLegacyInventory(req:Request,payload:JsonValue,origin:string|null){
 const access=await sheetAccess(req);
 if(!access||access.event_slug!=="halloween"||
    access.spreadsheet_id!==LIVE_SHEET_ID)
   return fail("sync_not_authorized",401,origin);
 const fields=["general","post","fanzine","legacy_rows"];
 if(fields.some(k=>!Number.isInteger(payload[k])||Number(payload[k])<0||Number(payload[k])>10000))
   return fail("invalid_legacy_counts",400,origin);
 const {data:event,error:lookupError}=await db.from("kon_events")
   .select("id").eq("slug","halloween").maybeSingle();
 if(lookupError||!event)return fail("event_unavailable",500,origin);
 const {error}=await db.from("kon_legacy_inventory").upsert({
  event_id:event.id,general_qty:payload.general,post_qty:payload.post,
  fanzine_qty:payload.fanzine,legacy_rows:payload.legacy_rows,
  last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  sync_source:"kon_club_fechas_apps_script"
 },{onConflict:"event_id"});
 if(error){console.error("legacy_inventory_sync",error.code);return fail("inventory_sync_failed",500,origin)}
 return respond({ok:true,inventory_synced:true},200,origin);
}
async function inventorySummary(req:Request,origin:string|null){
 if(!(await adminFromRequest(req)))return fail("unauthorized",401,origin);
 const {data:event,error:eventError}=await db.from("kon_events")
  .select("id,title,starts_at,sales_open").eq("slug","halloween").maybeSingle();
 if(eventError||!event)return fail("event_unavailable",500,origin);
 const [snap,prods,orders]=await Promise.all([
  getInventory(event.id),
  db.from("kon_products").select("id,slug,label,capacity,price_ars,enabled")
   .eq("event_id",event.id).order("sort_order"),
  db.from("kon_order_lines")
   .select("quantity,product_id,kon_orders!inner(status,expires_at,proof_received_at,event_id)")
   .eq("kon_orders.event_id",event.id)
 ]);
 if(prods.error||orders.error)return fail("inventory_unavailable",500,origin);
 const current=new Date();
 const reserved:Record<string,number>={};
 (orders.data||[]).forEach((line:JsonValue)=>{
  const o=line.kon_orders as JsonValue|null;
  if(!o||!["pending","verified","courtesy"].includes(String(o.status)))return;
  if(o.status==="pending"&&!o.proof_received_at&&new Date(String(o.expires_at))<current)return;
  reserved[String(line.product_id)]=(reserved[String(line.product_id)]||0)+Number(line.quantity||0);
 });
 const legacy:Record<string,number>={
  general:Number(snap?.general_qty||0),post:Number(snap?.post_qty||0),
  fanzine:Number(snap?.fanzine_qty||0)
 };
 const products=(prods.data||[]).map(p=>{
  const quantity=Number(reserved[p.id]||0);
  const old=Number(legacy[p.slug]||0);
  const cap=p.capacity===null?null:Number(p.capacity);
  return {slug:p.slug,label:p.label,price_ars:p.price_ars,capacity:cap,
   legacy:old,web:quantity,remaining:cap===null?null:Math.max(0,cap-old-quantity)};
 });
 return respond({ok:true,legacy_rows:Number(snap?.legacy_rows||0),
  legacy_last_synced_at:snap?.last_synced_at||null,legacy_fresh:liveInventoryFresh(snap),
  inventory_configured:products.every(p=>p.capacity!==null&&p.capacity>0),
  current_sales_open:Boolean(event.sales_open),products},200,origin);
}
async function getCatalog(req:Request, origin:string|null) {
  const isTest=new URL(req.url).searchParams.get("environment")==="test";
  if(isTest && !(await adminFromRequest(req)))return fail("unauthorized",401,origin);
  const slug=isTest?"halloween-staging":"halloween";
  const { data: events, error: eventError } = await db.from("kon_events")
    .select("id,slug,title,starts_at,address,sales_open,bank_alias").eq("slug",slug).limit(1);
  if (eventError || !events?.length) throw new Error("Catalog unavailable");
  const event = events[0];
  const { data: products, error: productError } = await db.from("kon_products")
    .select("id,slug,label,subtitle,price_ars,per_order_max,capacity,sort_order")
    .eq("event_id",event.id).eq("enabled",true).order("sort_order");
  if (productError) throw new Error("Products unavailable");
  const snapshot=isTest?null:await getInventory(event.id);
  const inventoryReady=isTest||(liveInventoryFresh(snapshot)&&
    (products||[]).length>0&&products.every(p=>p.capacity!==null&&Number(p.capacity)>0));
  const open=Boolean(event.sales_open&&inventoryReady);
  return respond({ok:true,
    event: { slug:event.slug,title:event.title,starts_at:event.starts_at,address:event.address,
      sales_open:open,bank_alias:event.bank_alias,
      test_mode:isTest,checkout_enabled:isTest?true:open,
      inventory_ready:inventoryReady },
    products: products || []
  },200,origin);
}
async function createOrder(req: Request, payload: JsonValue, origin: string | null) {
  const isTest=payload.environment==="test";
  if(payload.environment!==undefined && !["test","real"].includes(String(payload.environment)))
    return fail("invalid_environment",400,origin);
  if(isTest && !(await adminFromRequest(req)))return fail("unauthorized",401,origin);
  if (payload.website && typeof payload.website === "string" && payload.website.length > 0)
    return fail("invalid_input",400,origin); // honeypot
  const fullName = readString(payload.fullName,100);
  const email = readString(payload.email,150);
  const instagram = readString(payload.instagram,80);
  const discovery = readString(payload.discovery,150);
  if (fullName.length<2 || fullName.length>100 || email.length>150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      instagram.length>80 || discovery.length>150 || typeof payload.firstTime!=="boolean" ||
      !Array.isArray(payload.items) || payload.items.length > 6 || payload.items.length < 1)
    return fail("invalid_input",400,origin);
  if (payload.firstTime && discovery.length<2) return fail("missing_discovery",400,origin);
  // Staging must not receive real buyers' personal data, even from a modified browser.
  if(isTest && (!fullName.startsWith("PRUEBA ") || !email.toLowerCase().endsWith("@example.invalid") ||
     instagram!=="@konclub_prueba" || payload.firstTime!==false))
    return fail("test_data_only",400,origin);
  const tokenBytes=crypto.getRandomValues(new Uint8Array(32));
  const claimToken=Array.from(tokenBytes).map(b=>b.toString(16).padStart(2,"0")).join("");
  const tokenHash=await digest(claimToken);
  const items=(payload.items as unknown[]).map(x=>{
    if (!x || typeof x!=="object") return null;
    const item=x as JsonValue;
    return { id:item.id, qty:item.qty };
  });
  if (items.some(x=>!x || !validUuid(x.id) || !Number.isInteger(x.qty) || (x.qty as number)<1 || (x.qty as number)>100))
    return fail("invalid_items",400,origin);
  const { data, error }=await db.rpc("kon_submit_order",{
    p_event_slug:isTest?"halloween-staging":"halloween",
    p_name:fullName,p_email:email,p_instagram:instagram,
    p_first_time:payload.firstTime,p_discovery:discovery,p_lines:items,p_token_hash:tokenHash
  });
  if(error){
    if (/sales_closed/.test(error.message)) return fail("sales_closed",403,origin);
    if (/not_enough_capacity/.test(error.message)) return fail("not_enough_capacity",409,origin);
    if (/too_many_orders/.test(error.message)) return fail("rate_limited",429,origin);
    if (/invalid/.test(error.message)) return fail("invalid_order",400,origin);
    console.error("create_order_failed",error.code);
    return fail("unable_to_create_order",500,origin);
  }
  return respond({ok:true,order:data,proof_token:claimToken},201,origin);
}
function fileType(bytes: Uint8Array){
  if(bytes.length>=8 && bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71 &&
     bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) return "image/png";
  if(bytes.length>=3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return "image/jpeg";
  if(bytes.length>=5 && bytes[0]===37 && bytes[1]===80 && bytes[2]===68 && bytes[3]===70 && bytes[4]===45) return "application/pdf";
  return null;
}
async function uploadProof(req: Request, origin: string | null){
  const contentLength=Number(req.headers.get("content-length")||"0");
  if(contentLength>11*1024*1024) return fail("file_too_large",413,origin);
  const form=await req.formData();
  const orderId=form.get("order_id"), claim=form.get("proof_token"), file=form.get("file");
  if(!validUuid(orderId)||typeof claim!=="string"||claim.length!==64||
     !(file instanceof File)||file.size<1||file.size>10*1024*1024)
    return fail("invalid_proof",400,origin);
  const {data:order,error}=await db.from("kon_orders")
    .select("id,event_id,status,expires_at,proof_token_sha256")
    .eq("id",orderId).maybeSingle();
  if(error||!order)return fail("invalid_or_expired_order",403,origin);
  const {data:orderEvent,error:eventError}=await db.from("kon_events")
    .select("slug").eq("id",order.event_id).maybeSingle();
  if(eventError||!orderEvent)return fail("event_unavailable",500,origin);
  const isTest=orderEvent.slug==="halloween-staging";
  if(isTest && !(await adminFromRequest(req)))return fail("unauthorized",401,origin);
  if(error||!order||order.status!=="pending"||new Date(order.expires_at).getTime()<Date.now()||
      !order.proof_token_sha256||order.proof_token_sha256!==await digest(claim))
    return fail("invalid_or_expired_order",403,origin);
  const {data: existing}=await db.from("kon_payment_proofs").select("id").eq("order_id",orderId).maybeSingle();
  if(existing) return fail("proof_already_uploaded",409,origin);
  if(isTest && (file.name!=="KON-TEST-comprobante.png" || file.type!=="image/png"))
    return fail("test_proof_only",400,origin);
  const content=new Uint8Array(await file.arrayBuffer());
  const mime=fileType(content);
  if(isTest && mime!=="image/png")return fail("test_proof_only",400,origin);
  if(!mime) return fail("unsupported_file_type",400,origin);
  const ext=mime==="image/png"?"png":mime==="image/jpeg"?"jpg":"pdf";
  const storagePath=orderId+"/"+crypto.randomUUID()+"."+ext;
  const {error:uploadError}=await db.storage.from("kon-payment-proofs").upload(
    storagePath,content,{contentType:mime,upsert:false}
  );
  if(uploadError){console.error("upload_error",uploadError.message);return fail("unable_to_upload_proof",500,origin);}
  const {error:saveError}=await db.from("kon_payment_proofs").insert({
    order_id:orderId,storage_path:storagePath,original_filename:readString(file.name,180),
    media_type:mime,size_bytes:file.size
  });
  if(saveError){
    await db.storage.from("kon-payment-proofs").remove([storagePath]);
    return fail("proof_already_uploaded",409,origin);
  }
  await db.from("kon_orders").update({proof_received_at:new Date().toISOString(),
     proof_token_sha256:null}).eq("id",orderId).eq("status","pending");
  await db.from("kon_order_audit").insert({order_id:orderId,action:"proof_uploaded",actor_source:"system"});
  return respond({ok:true,status:"pending_verification"},200,origin);
}
async function listOrders(req: Request, origin: string|null){
  const admin=await adminFromRequest(req);
  if(!admin)return fail("unauthorized",401,origin);
  // Real orders and staging orders are never mixed in administration.
  const environment=new URL(req.url).searchParams.get("environment")==="test"?"test":"real";
  const slug=environment==="test"?"halloween-staging":"halloween";
  const {data:event,error:eventError}=await db.from("kon_events").select("id").eq("slug",slug).maybeSingle();
  if(eventError||!event)return fail("event_unavailable",500,origin);
  const {data,error}=await db.from("kon_orders").select(
    "id,order_code,full_name,email,instagram,first_time,source,amount_expected_ars,amount_received_ars,status,verified_at,verified_by,created_at,admin_note,proof_received_at,kon_order_lines(quantity,unit_price_ars,kon_products(label,slug))"
  ).eq("event_id",event.id).order("created_at",{ascending:false}).limit(150);
  if(error){console.error("orders_error",error.message);return fail("unable_to_list",500,origin);}
  return respond({ok:true,orders:data||[],admin:admin.email,environment},200,origin);
}
async function approveOrder(req:Request,payload:JsonValue,origin:string|null){
 const admin=await adminFromRequest(req);
 if(!admin)return fail("unauthorized",401,origin);
 if(!validUuid(payload.order_id)||!["verified","rejected","courtesy","cancelled"].includes(String(payload.status)))
  return fail("invalid_input",400,origin);
 const status=String(payload.status);
 const amount=payload.amount_received_ars;
 if(status==="verified"&&(!Number.isInteger(amount)||Number(amount)<1||Number(amount)>2000000||payload.bank_checked!==true))
  return fail("bank_confirmation_required",400,origin);
 const environment=payload.environment==="test"?"test":"real";
 if(environment==="test"&&status==="verified")return fail("test_payments_not_allowed",400,origin);
 const {data:event}=await db.from("kon_events").select("id").eq("slug",environment==="test"?"halloween-staging":"halloween").maybeSingle();
 if(!event)return fail("event_unavailable",404,origin);
 const {data:order}=await db.from("kon_orders").select("id").eq("event_id",event.id).eq("id",payload.order_id).maybeSingle();
 if(!order)return fail("not_found",404,origin);
 const {data,error}=await db.rpc("kon_review_order",{
  p_order_id:payload.order_id,p_status:status,p_amount:status==="verified"?amount:null,
  p_note:readString(payload.note,500),p_actor_email:admin.email,p_actor_source:"panel",
  p_actor_id:admin.id,p_identity_verified:true
 });
 if(error){
  if(/order_not_found/.test(error.message))return fail("not_found",404,origin);
  if(/proof_required/.test(error.message))return fail("proof_required",409,origin);
  if(/already_reviewed/.test(error.message))return fail("already_reviewed",409,origin);
  return fail("unable_to_review",500,origin);
 }
 return respond({ok:true,status:data.status,unchanged:data.unchanged,email_dispatched:false},200,origin);
}
async function proofLink(req:Request,origin:string|null){
  const admin=await adminFromRequest(req);
  if(!admin)return fail("unauthorized",401,origin);
  const params=new URL(req.url).searchParams;
  const id=params.get("order_id");
  if(!validUuid(id))return fail("invalid_input",400,origin);
  const environment=params.get("environment")==="test"?"test":"real";
  const {data:event}=await db.from("kon_events").select("id").eq("slug",environment==="test"?"halloween-staging":"halloween").maybeSingle();
  if(!event)return fail("event_unavailable",404,origin);
  const {data:order}=await db.from("kon_orders").select("id").eq("id",id).eq("event_id",event.id).maybeSingle();
  if(!order)return fail("not_found",404,origin);
  const {data,error}=await db.from("kon_payment_proofs").select("storage_path")
    .eq("order_id",id).maybeSingle();
  if(error||!data)return fail("not_found",404,origin);
  const {data:link,error:linkErr}=await db.storage.from("kon-payment-proofs")
    .createSignedUrl(data.storage_path,60);
  if(linkErr||!link)return fail("unable_to_open_proof",500,origin);
  return respond({ok:true,url:link.signedUrl},200,origin);
}

async function sheetAccess(req:Request){
 const token=req.headers.get("x-kon-sheet-token")||"";
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=await digest(token);
 const {data,error}=await db.from("kon_sheet_connectors")
  .select("id,spreadsheet_id,tab_title,event_slug,secret_sha256,enabled")
  .eq("secret_sha256",hash).eq("enabled",true).maybeSingle();
 if(error||!data||!data.enabled||!data.secret_sha256)return null;
 return data;
}
async function sheetExport(req:Request,origin:string|null){
 const access=await sheetAccess(req);
 if(!access)return fail("sync_not_authorized",401,origin);
 const {data:event}=await db.from("kon_events").select("id").eq("slug",access.event_slug).single();
 if(!event)return fail("event_unavailable",404,origin);
 const {data,error}=await db.from("kon_orders")
  .select("id,order_code,full_name,email,instagram,source,status,amount_expected_ars,amount_received_ars,admin_note,created_at,sheets_row_key,verified_at,kon_order_lines(quantity,kon_products(slug))")
  .eq("event_id",event.id).in("source",["web","manual"])
  .order("created_at",{ascending:true}).limit(300);
 if(error)return fail("sync_unavailable",500,origin);
 const orders=(data||[]).map(o=>{
  const quantities:Record<string,number>={general:0,post:0,fanzine:0};
  (o.kon_order_lines||[]).forEach((l:JsonValue)=>{
   const product=l.kon_products as JsonValue | null;
   const slug=product?.slug as string;
   if(slug && Object.hasOwn(quantities,slug))quantities[slug]+=Number(l.quantity||0);
  });
  return {id:o.id,code:o.order_code,name:o.full_name,email:o.email,instagram:o.instagram,
   general:quantities.general,post:quantities.post,fanzine:quantities.fanzine,
   status:o.status,expected:o.amount_expected_ars,received:o.amount_received_ars,
   note:o.admin_note,source:o.source,sheet_row_key:o.sheets_row_key,
   created_at:o.created_at,verified_at:o.verified_at};
 });
 return respond({ok:true,tab_title:access.tab_title,orders},200,origin);
}
async function sheetAcknowledge(req:Request,payload:JsonValue,origin:string|null){
 const access=await sheetAccess(req);
 if(!access)return fail("sync_not_authorized",401,origin);
 if(!validUuid(payload.order_id)||!Number.isInteger(payload.row)||Number(payload.row)<2||Number(payload.row)>100000)
  return fail("invalid_input",400,origin);
 const rowKey=access.tab_title+":"+String(payload.row);
 const {data:event}=await db.from("kon_events").select("id").eq("slug",access.event_slug).maybeSingle();
 if(!event)return fail("event_unavailable",404,origin);
 const {data:order,error:findError}=await db.from("kon_orders").select("id,sheets_row_key")
   .eq("id",payload.order_id).eq("event_id",event.id).maybeSingle();
 if(findError||!order)return fail("not_found",404,origin);
 if(order.sheets_row_key && order.sheets_row_key!==rowKey)return fail("conflicting_sheet_row",409,origin);
 if(order.sheets_row_key===rowKey)return respond({ok:true,unchanged:true},200,origin);
 const {data:changed,error}=await db.from("kon_orders").update({sheets_row_key:rowKey})
  .eq("id",order.id).is("sheets_row_key",null).select("id").maybeSingle();
 if(error||!changed)return fail("conflicting_sheet_row",409,origin);
 return respond({ok:true},200,origin);
}
async function sheetReview(req:Request,payload:JsonValue,origin:string|null){
 const access=await sheetAccess(req);
 if(!access)return fail("sync_not_authorized",401,origin);
 if(!validUuid(payload.order_id)||!["verified","rejected","courtesy","cancelled"].includes(String(payload.status)))
  return fail("invalid_input",400,origin);
 const status=String(payload.status);
 if(access.event_slug==="halloween-staging"&&status==="verified")return fail("test_payments_not_allowed",400,origin);
 const amount=payload.amount_received_ars;
 if(status==="verified"&&(!Number.isInteger(amount)||Number(amount)<1||Number(amount)>2000000||payload.bank_checked!==true))
  return fail("bank_confirmation_required",400,origin);
 const {data:event}=await db.from("kon_events").select("id").eq("slug",access.event_slug).maybeSingle();
 if(!event)return fail("event_unavailable",404,origin);
 const {data:order}=await db.from("kon_orders").select("id").eq("id",payload.order_id).eq("event_id",event.id).maybeSingle();
 if(!order)return fail("not_found",404,origin);
 const actorEmail=readString(payload.actor_email,180);
 const {data,error}=await db.rpc("kon_review_order",{
  p_order_id:payload.order_id,p_status:status,p_amount:status==="verified"?amount:null,
  p_note:readString(payload.note,500),p_actor_email:actorEmail,p_actor_source:"sheets",
  p_actor_id:null,p_identity_verified:false
 });
 if(error){
  if(/order_not_found/.test(error.message))return fail("not_found",404,origin);
  if(/proof_required/.test(error.message))return fail("proof_required",409,origin);
  if(/already_reviewed/.test(error.message))return fail("conflicting_status",409,origin);
  return fail("unable_to_review",500,origin);
 }
 return respond({ok:true,unchanged:data.unchanged,email_dispatched:false},200,origin);
}
async function pairSheets(req:Request,payload:JsonValue,origin:string|null){
 const admin=await adminFromRequest(req);
 if(!admin)return fail("unauthorized",401,origin);
 const isTest=payload.environment==="test";
 if(payload.environment!==undefined&&!["test","real"].includes(String(payload.environment)))
   return fail("invalid_environment",400,origin);
 const connectorId=isTest?2:1;
 const {data:connector}=await db.from("kon_sheet_connectors").select("id,spreadsheet_id,tab_title").eq("id",connectorId).maybeSingle();
 if(!connector)return fail("connector_not_found",404,origin);
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const token=Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
 const secretHash=await digest(token);
 const {error}=await db.from("kon_sheet_connectors").update({
  secret_sha256:secretHash,enabled:true,updated_at:new Date().toISOString()
 }).eq("id",connectorId);
 if(error)return fail("unable_to_generate_sync_key",500,origin);
 // Never persist or log the cleartext key. Rotates only the selected connector.
 return respond({ok:true,sync_token:token,environment:isTest?"test":"real",
  tab_title:connector.tab_title,warning:"Guardalo solo en las propiedades privadas de Apps Script. No se puede consultar nuevamente."},200,origin);
}


const KON_MAIL_SENDER="konclub.entradas@gmail.com";
const KON_MAIL_REPLY_TO="kon.club@proton.me";
async function mailAccess(req:Request){
 const token=req.headers.get("x-kon-mail-token")||"";
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const hash=await digest(token);
 const {data,error}=await db.from("kon_mail_settings")
  .select("expected_sender,reply_to,enabled,reminders_enabled,reminder_approved_starts_at,secret_sha256")
  .eq("id",1).maybeSingle();
 if(error||!data||!data.secret_sha256||data.secret_sha256!==hash)return null;
 if(data.expected_sender!==KON_MAIL_SENDER||data.reply_to!==KON_MAIL_REPLY_TO)return null;
 return data;
}
async function pairMail(req:Request,origin:string|null){
 const admin=await adminFromRequest(req);
 if(!admin)return fail("unauthorized",401,origin);
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const token=Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
 const {error}=await db.from("kon_mail_settings").update({
  secret_sha256:await digest(token),enabled:false,updated_at:new Date().toISOString()
 }).eq("id",1);
 if(error)return fail("mail_pair_unavailable",500,origin);
 return respond({ok:true,sync_token:token,enabled:false,
  sender:KON_MAIL_SENDER,reply_to:KON_MAIL_REPLY_TO,
  warning:"Se configuró la conexión de correo, pero los envíos reales siguen DESACTIVADOS."},200,origin);
}
async function mailPing(req:Request,origin:string|null){
 const config=await mailAccess(req);
 if(!config)return fail("mail_not_authorized",401,origin);
 return respond({ok:true,sender:config.expected_sender,reply_to:config.reply_to,
  enabled:config.enabled,reminders_enabled:config.reminders_enabled,
  reminder_approved_starts_at:config.reminder_approved_starts_at},200,origin);
}
async function mailPreview(req:Request,origin:string|null){
 const config=await mailAccess(req);
 if(!config)return fail("mail_not_authorized",401,origin);
 const url=new URL(req.url);
 const kind=url.searchParams.get("kind")||"received";
 if(!["received","verified","courtesy","reminder"].includes(kind))
  return fail("invalid_kind",400,origin);
 const {data:event,error:eventError}=await db.from("kon_events")
  .select("slug,title,starts_at,address").eq("slug","halloween").maybeSingle();
 if(eventError||!event)return fail("event_unavailable",500,origin);
 const mock=formatKonMail({
  kind:kind as "received"|"verified"|"courtesy"|"reminder",
  code:"PRUEBA-NO-REAL",name:"PRUEBA KON CLUB",event_slug:"halloween",
  items:[{label:"ENTRADA GENERAL",quantity:1},{label:"FANZINE",quantity:1}],
  total:13000,received:13000,
  event_title:String(event.title||"Kon Club"),
  starts_at:event.starts_at||null,
  address:String(event.address||""),
  alias:"NO.TRANSFERIR",test:true
 });
 return respond({ok:true,to:KON_MAIL_SENDER,
  subject:"[PRUEBA · NO REAL] "+mock.subject,
  text:"ESTE ES UN CORREO DE PRUEBA. NO EXISTE COMPRA NI PAGO REAL.\n\n"+mock.text,
  html:mock.html,
  enabled:config.enabled
 },200,origin);
}
async function mailNext(req:Request,origin:string|null){
 const config=await mailAccess(req);
 if(!config)return fail("mail_not_authorized",401,origin);
 if(!config.enabled)return respond({ok:true,enabled:false,mail:null},200,origin);
 // The existing Gmail five-minute trigger is our scheduler; no new trigger
 // or public cron endpoint is required. Never enqueue if either safety flag is off.
 if(config.reminders_enabled){
  const {error:queueError}=await db.rpc("kon_queue_due_reminders");
  if(queueError){
   console.error("mail_reminder_queue_failed",queueError.code);
   return fail("mail_reminder_queue_unavailable",500,origin);
  }
 }
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const claimToken=Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
 const {data:claimed,error}=await db.rpc("kon_claim_next_email",{p_lease_sha256:await digest(claimToken)});
 if(error){console.error("mail_claim_failed",error.code);return fail("mail_claim_unavailable",500,origin)}
 if(!claimed)return respond({ok:true,enabled:true,mail:null},200,origin);
 const {data:order,error:orderError}=await db.from("kon_orders")
  .select("id,order_code,full_name,email,status,amount_expected_ars,amount_received_ars,kon_events(slug,title,starts_at,address,bank_alias),kon_order_lines(quantity,kon_products(label,slug))")
  .eq("id",claimed.order_id).maybeSingle();
 if(orderError||!order||order.kon_events?.slug!=="halloween"||
    String(order.email).toLowerCase()!==String(claimed.recipient).toLowerCase()||
    (claimed.kind==="reminder"&&!["verified","courtesy"].includes(order.status))){
  console.error("mail_invalid_claim");
  return fail("invalid_mail_order",500,origin); // Held for manual reconciliation: never resend blindly.
 }
 const msg=formatKonMail({
  kind:claimed.kind,code:order.order_code,name:order.full_name,
  items:(order.kon_order_lines||[]).map((line:JsonValue)=>({
   label:String((line.kon_products as JsonValue|null)?.label||"Entrada"),
   quantity:Number(line.quantity||0)
  })),
  total:Number(order.amount_expected_ars),received:order.amount_received_ars,
  event_title:String(order.kon_events.title||"Kon Club"),
  starts_at:order.kon_events.starts_at||null,
  address:String(order.kon_events.address||""),
  alias:String(order.kon_events.bank_alias||""),
  event_slug:String(order.kon_events.slug||"")
 });
 return respond({ok:true,enabled:true,mail:{
  id:claimed.id,claim_token:claimToken,to:claimed.recipient,
  ...msg,kind:claimed.kind
 }},200,origin);
}
async function mailAcknowledge(req:Request,payload:JsonValue,origin:string|null){
 const config=await mailAccess(req);
 if(!config)return fail("mail_not_authorized",401,origin);
 if(!validUuid(payload.id)||typeof payload.claim_token!=="string"||
  !/^[a-f0-9]{64}$/.test(payload.claim_token)||
  typeof payload.sent!=="boolean")return fail("invalid_input",400,origin);
 const {data:updated,error}=await db.rpc("kon_finish_email",{
  p_id:payload.id,p_lease_sha256:await digest(payload.claim_token),
  p_sent:payload.sent,p_error:readString(payload.error,300)
 });
 if(error)return fail("mail_ack_unavailable",500,origin);
 if(!updated)return fail("mail_claim_missing",409,origin);
 return respond({ok:true},200,origin);
}

async function listPlannedDates(req:Request,origin:string|null){
 const admin=await adminFromRequest(req);
 if(!admin)return fail("unauthorized",401,origin);
 const [plans,current]=await Promise.all([
  db.from("kon_planned_dates")
    .select("event_date,label,film_title,flyer_url,starts_at,planning_status")
    .order("event_date",{ascending:true}).limit(50),
  db.from("kon_events").select("slug,title,starts_at,sales_open")
    .eq("slug","halloween").maybeSingle()
 ]);
 if(plans.error||current.error)return fail("schedule_unavailable",500,origin);
 return respond({ok:true,planned_dates:plans.data||[],
   current_event:current.data||null},200,origin);
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(origin && !acceptedOrigins.has(origin))return fail("origin_not_allowed",403,origin);
  const path=new URL(req.url).pathname.split("/").pop();
  try{
    if(req.method==="GET"&&path==="catalog")return await getCatalog(req,origin);
    if(req.method==="GET"&&path==="inventory-summary")return await inventorySummary(req,origin);
    if(req.method==="GET"&&path==="planned-dates")return await listPlannedDates(req,origin);
    if(req.method==="GET"&&path==="mail-ping")return await mailPing(req,origin);
    if(req.method==="GET"&&path==="mail-preview")return await mailPreview(req,origin);
    if(req.method==="GET"&&path==="mail-next")return await mailNext(req,origin);
    if(req.method==="POST"&&path==="mail-pair")return await pairMail(req,origin);
    if(req.method==="POST"&&path==="sync-inventory"){
      const len=Number(req.headers.get("content-length")||"0");
      if(len>1500)return fail("payload_too_large",413,origin);
      const body=await req.json() as JsonValue;
      return await updateLegacyInventory(req,body,origin);
    }
    if(req.method==="GET"&&path==="sync-export")return await sheetExport(req,origin);
    if(req.method==="GET"&&path==="orders")return await listOrders(req,origin);
    if(req.method==="GET"&&path==="proof-link")return await proofLink(req,origin);
    if(req.method==="POST"&&path==="proof")return await uploadProof(req,origin);
    if(req.method==="POST"&&path==="mail-ack"){
      const len=Number(req.headers.get("content-length")||"0");
      if(len>3000)return fail("payload_too_large",413,origin);
      const payload=await req.json() as JsonValue;
      return await mailAcknowledge(req,payload,origin);
    }
    if(req.method==="POST"&&["order","review","sync-review","sync-ack","sync-pair"].includes(String(path))){
      const len=Number(req.headers.get("content-length")||"0");
      if(len>12000)return fail("payload_too_large",413,origin);
      const body=await req.json() as JsonValue;
      if(path==="order")return await createOrder(req,body,origin);
      if(path==="sync-review")return await sheetReview(req,body,origin);
      if(path==="sync-ack")return await sheetAcknowledge(req,body,origin);
      if(path==="sync-pair")return await pairSheets(req,body,origin);
      return await approveOrder(req,body,origin);
    }
    return fail("not_found",404,origin);
  }catch(error){
    console.error("ticket_api_exception",error instanceof Error?error.message:"unknown");
    return fail("request_failed",500,origin);
  }
});
