import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
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
  const { data: member, error: dbError } = await db.from("kon_admins")
    .select("user_id,google_email,enabled")
    .eq("user_id", user.id).eq("enabled", true).maybeSingle();
  if (dbError || !member || member.google_email.toLowerCase() !== user.email.toLowerCase()) return null;
  return { id: user.id, email: user.email.toLowerCase() };
}
function validUuid(input: unknown): input is string {
  return typeof input === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
}
function readString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max + 1) : "";
}
async function getCatalog() {
  const { data: events, error: eventError } = await db.from("kon_events")
    .select("id,slug,title,starts_at,address,sales_open,bank_alias").eq("slug", "halloween").limit(1);
  if (eventError || !events?.length) throw new Error("Catalog unavailable");
  const event = events[0];
  const { data: products, error: productError } = await db.from("kon_products")
    .select("id,slug,label,subtitle,price_ars,per_order_max,capacity,sort_order")
    .eq("event_id",event.id).eq("enabled",true).order("sort_order");
  if (productError) throw new Error("Products unavailable");
  return {
    event: { slug:event.slug,title:event.title, starts_at:event.starts_at,address:event.address,
      sales_open:event.sales_open,bank_alias:event.bank_alias },
    products: products || []
  };
}
async function createOrder(payload: JsonValue, origin: string | null) {
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
    p_event_slug:"halloween",p_name:fullName,p_email:email,p_instagram:instagram,
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
    .select("id,status,expires_at,proof_token_sha256").eq("id",orderId).maybeSingle();
  if(error||!order||order.status!=="pending"||new Date(order.expires_at).getTime()<Date.now()||
      !order.proof_token_sha256||order.proof_token_sha256!==await digest(claim))
    return fail("invalid_or_expired_order",403,origin);
  const {data: existing}=await db.from("kon_payment_proofs").select("id").eq("order_id",orderId).maybeSingle();
  if(existing) return fail("proof_already_uploaded",409,origin);
  const content=new Uint8Array(await file.arrayBuffer());
  const mime=fileType(content);
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
  const {data,error}=await db.from("kon_orders").select(
    "id,order_code,full_name,email,instagram,first_time,source,amount_expected_ars,amount_received_ars,status,verified_at,verified_by,created_at,admin_note,proof_received_at,kon_order_lines(quantity,unit_price_ars,kon_products(label,slug))"
  ).order("created_at",{ascending:false}).limit(150);
  if(error){console.error("orders_error",error.message);return fail("unable_to_list",500,origin);}
  return respond({ok:true,orders:data||[],admin:admin.email},200,origin);
}
async function approveOrder(req: Request, payload: JsonValue,origin:string|null){
  const admin=await adminFromRequest(req);
  if(!admin)return fail("unauthorized",401,origin);
  if(!validUuid(payload.order_id) || !["verified","rejected","courtesy","cancelled"].includes(String(payload.status)))
    return fail("invalid_input",400,origin);
  const status=String(payload.status);
  const amount=payload.amount_received_ars;
  if(status==="verified" && (!Number.isInteger(amount)|| Number(amount)<0 || Number(amount)>2000000))
    return fail("invalid_amount",400,origin);
  const {data:order,error:readErr}=await db.from("kon_orders").select("id,status,proof_received_at")
    .eq("id",payload.order_id).maybeSingle();
  if(readErr||!order)return fail("not_found",404,origin);
  if(order.status!== "pending")return fail("already_reviewed",409,origin);
  if(status==="verified"&&!order.proof_received_at)return fail("proof_required",409,origin);
  const now=new Date().toISOString();
  const {data:changed,error}=await db.from("kon_orders").update({
    status,amount_received_ars:status==="verified"?amount:status==="courtesy"?0:null,
    verified_by:admin.email,verified_at:now,updated_at:now,
    admin_note:readString(payload.note,500)
  }).eq("id",order.id).eq("status","pending").select("id,status").maybeSingle();
  if(error||!changed)return fail("already_reviewed",409,origin);
  await db.from("kon_order_audit").insert({order_id:order.id,action:"reviewed",
    old_status:"pending",new_status:status,actor_source:"panel",actor_id:admin.id,
    metadata:{actor_email:admin.email}});
  // Email dispatch intentionally not enabled until mail provider configured.
  return respond({ok:true,status:changed.status,email_dispatched:false},200,origin);
}
async function proofLink(req:Request,origin:string|null){
  const admin=await adminFromRequest(req);
  if(!admin)return fail("unauthorized",401,origin);
  const id=new URL(req.url).searchParams.get("order_id");
  if(!validUuid(id))return fail("invalid_input",400,origin);
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
 const {data,error}=await db.from("kon_sheet_connectors")
  .select("spreadsheet_id,tab_title,secret_sha256,enabled").eq("id",1).maybeSingle();
 if(error||!data||!data.enabled||!data.secret_sha256)return null;
 if(await digest(token)!==data.secret_sha256)return null;
 return data;
}
async function sheetExport(req:Request,origin:string|null){
 const access=await sheetAccess(req);
 if(!access)return fail("sync_not_authorized",401,origin);
 const {data:event}=await db.from("kon_events").select("id").eq("slug","halloween").single();
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
 const {data:order,error:findError}=await db.from("kon_orders").select("id,sheets_row_key")
   .eq("id",payload.order_id).maybeSingle();
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
 if(!validUuid(payload.order_id)|| !["verified","rejected","courtesy","cancelled"].includes(String(payload.status)))
  return fail("invalid_input",400,origin);
 const status=String(payload.status);
 const amount=payload.amount_received_ars;
 if(status==="verified" && (!Number.isInteger(amount)||Number(amount)<0||Number(amount)>2000000||
     payload.bank_checked!==true))
  return fail("bank_confirmation_required",400,origin);
 const {data:order,error:findError}=await db.from("kon_orders")
  .select("id,status,proof_received_at,source").eq("id",payload.order_id).maybeSingle();
 if(findError||!order)return fail("not_found",404,origin);
 if(order.status===status)return respond({ok:true,unchanged:true},200,origin);
 if(order.status!=="pending")return fail("conflicting_status",409,origin);
 if(status==="verified"&&order.source==="web"&&!order.proof_received_at)return fail("proof_required",409,origin);
 const actorEmail=readString(payload.actor_email,180);
 // Apps Script onEdit cannot always identify the editor: audit as unverified when missing.
 const actorId=null; // The trigger email cannot be treated as verified identity.
 const {data:changed,error}=await db.from("kon_orders").update({
  status,amount_received_ars:status==="verified"?amount:status==="courtesy"?0:null,
  verified_by:actorEmail||"Editor de Sheets (identidad no disponible)",
  verified_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  admin_note:readString(payload.note,500)
 }).eq("id",order.id).eq("status","pending").select("id").maybeSingle();
 if(error||!changed)return fail("conflicting_status",409,origin);
 await db.from("kon_order_audit").insert({order_id:order.id,action:"reviewed",old_status:"pending",
  new_status:status,actor_source:"sheets",actor_id:actorId,
  metadata:{reported_editor_email:actorEmail||null,identity_verified:false}});
 return respond({ok:true,email_dispatched:false},200,origin);
}


async function pairSheets(req:Request,origin:string|null){
 const admin=await adminFromRequest(req);
 if(!admin)return fail("unauthorized",401,origin);
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const token=Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
 const secretHash=await digest(token);
 const {error}=await db.from("kon_sheet_connectors").update({
  secret_sha256:secretHash,enabled:true,updated_at:new Date().toISOString()
 }).eq("id",1);
 if(error)return fail("unable_to_generate_sync_key",500,origin);
 // Never persist or log the cleartext key. Rotates previous key.
 return respond({ok:true,sync_token:token,warning:"Guardalo en Script Properties: KON_SYNC_TOKEN. No se puede consultar nuevamente."},200,origin);
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(origin && !acceptedOrigins.has(origin))return fail("origin_not_allowed",403,origin);
  const path=new URL(req.url).pathname.split("/").pop();
  try{
    if(req.method==="GET"&&path==="catalog")return respond({ok:true,...await getCatalog()},200,origin);
    if(req.method==="GET"&&path==="sync-export")return await sheetExport(req,origin);
    if(req.method==="GET"&&path==="orders")return await listOrders(req,origin);
    if(req.method==="GET"&&path==="proof-link")return await proofLink(req,origin);
    if(req.method==="POST"&&path==="proof")return await uploadProof(req,origin);
    if(req.method==="POST"&&["order","review","sync-review","sync-ack","sync-pair"].includes(String(path))){
      const len=Number(req.headers.get("content-length")||"0");
      if(len>12000)return fail("payload_too_large",413,origin);
      const body=await req.json() as JsonValue;
      if(path==="order")return await createOrder(body,origin);
      if(path==="sync-review")return await sheetReview(req,body,origin);
      if(path==="sync-ack")return await sheetAcknowledge(req,body,origin);
      if(path==="sync-pair")return await pairSheets(req,origin);
      return await approveOrder(req,body,origin);
    }
    return fail("not_found",404,origin);
  }catch(error){
    console.error("ticket_api_exception",error instanceof Error?error.message:"unknown");
    return fail("request_failed",500,origin);
  }
});
