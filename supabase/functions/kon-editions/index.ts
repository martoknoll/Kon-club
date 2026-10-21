import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const url=Deno.env.get("SUPABASE_URL")||"";
const fallback=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
const role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||fallback.default;
if(!url||!role)throw new Error("Missing Supabase service configuration");
const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}});
const trusted=new Set(["https://kon-club.vercel.app"]);
const bucket="kon-edition-media";
function headers(origin:string|null){return {"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":origin&&trusted.has(origin)?origin:"null","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Cache-Control":"no-store","Vary":"Origin"};}
function send(data:unknown,code:number,origin:string|null){return new Response(JSON.stringify(data),{status:code,headers:headers(origin)});}
function bad(error:string,code:number,origin:string|null){return send({ok:false,error},code,origin);}
const uuid=(v:unknown)=>typeof v==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const slug=(v:unknown)=>typeof v==="string"&&/^[a-z0-9][a-z0-9-]{2,59}$/.test(v);
const color=(v:unknown)=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v);
const string=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max+1):"";
const publicFile=(v:string)=>!v||/^\/public\/media\/[A-Za-z0-9_.-]+$/.test(v)||v.startsWith(url+"/storage/v1/object/public/"+bucket+"/");
const ticketLink=(v:string)=>!v||/^\/(?!\/)[A-Za-z0-9/_?.=&%-]+$/.test(v)||/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(v);
async function isEditor(req:Request){
 const bearer=/^Bearer (.+)$/i.exec(req.headers.get("authorization")||"");
 if(!bearer)return false;
 const {data:{user},error}=await db.auth.getUser(bearer[1]);
 if(error||!user||!user.email||!user.email_confirmed_at)return false;
 const {data:editor,error:editorError}=await db.from("kon_allowed_editors").select("email").eq("email",user.email.toLowerCase()).maybeSingle();
 return !editorError&&Boolean(editor);
}
const fields="id,slug,status,archive_number,title,film_title,director,film_year,tag,headline,synopsis,starts_at,ends_at,address,price_ars,flyer_url,logo_url,ticket_url,palette,created_at,updated_at,published_at";
function validated(input:Record<string,unknown>){
 const requiredText=["title","film_title","tag","headline","synopsis","director","address"];
 const out:Record<string,unknown>={};
 for(const key of requiredText){const max=key==="synopsis"?1800: key==="address"?250:140; const v=string(input[key],max);if(v.length>max)throw Error("text_too_long_"+key);out[key]=v;}
 if(!slug(input.slug))throw Error("invalid_slug");
 out.slug=input.slug;
 const year=input.film_year===null||input.film_year===""||input.film_year===undefined?null:Number(input.film_year);
 if(year!==null&&(!Number.isInteger(year)||year<1880||year>2100))throw Error("invalid_year");
 out.film_year=year;
 const price=input.price_ars===null||input.price_ars===""||input.price_ars===undefined?null:Number(input.price_ars);
 if(price!==null&&(!Number.isInteger(price)||price<0||price>1000000))throw Error("invalid_price");
 out.price_ars=price;
 for(const key of ["starts_at","ends_at"]){const val=input[key];out[key]=!val?null:String(val);if(out[key]&&(!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(String(val))||!Number.isFinite(Date.parse(String(val)))))throw Error("invalid_"+key);}
 if(out.starts_at&&out.ends_at&&Date.parse(String(out.ends_at))<=Date.parse(String(out.starts_at)))throw Error("invalid_time_range");
 for(const key of ["flyer_url","logo_url"]){const v=string(input[key],600);if(!publicFile(v))throw Error("invalid_media_url");out[key]=v||null;}
 const link=string(input.ticket_url,600);if(!ticketLink(link))throw Error("invalid_ticket_url");out.ticket_url=link||null;
 const palette=input.palette;
 if(!palette||typeof palette!=="object"||Array.isArray(palette))throw Error("invalid_palette");
 const colors:Record<string,string>={};
 for(const key of ["bg","on","paper","ink","accent","secondary"]){const v=(palette as Record<string,unknown>)[key];if(!color(v))throw Error("invalid_color_"+key);colors[key]=String(v).toLowerCase();}
 out.palette=colors;
 return out;
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
 if(origin&&!trusted.has(origin))return bad("origin_denied",403,origin);
 const q=new URL(req.url);
 try{
  if(req.method==="GET"&&q.searchParams.get("view")==="public"){
   const {data,error}=await db.from("kon_editions").select(fields).in("status",["published","archived"]).order("archive_number",{ascending:false});
   if(error)return bad("editions_unavailable",500,origin);
   return send({ok:true,active:(data||[]).find(e=>e.status==="published")||null,archive:(data||[]).filter(e=>e.status==="archived")},200,origin);
  }
  if(!await isEditor(req))return bad("unauthorized",401,origin);
  if(req.method==="GET"){
   const view=q.searchParams.get("view");
   if(view==="list"){const {data,error}=await db.from("kon_editions").select(fields).order("starts_at",{ascending:false});if(error)return bad("list_unavailable",500,origin);return send({ok:true,editions:data},200,origin);}
   if(view==="detail"){const id=q.searchParams.get("id");if(!uuid(id))return bad("invalid_id",400,origin);const {data,error}=await db.from("kon_editions").select(fields).eq("id",id).maybeSingle();if(error||!data)return bad("edition_not_found",404,origin);return send({ok:true,edition:data},200,origin);}
   return bad("invalid_view",400,origin);
  }
  if(req.method!=="POST")return bad("invalid_method",405,origin);
  const action=q.searchParams.get("action");
  if(action==="upload"){
   const id=q.searchParams.get("id"),kind=q.searchParams.get("kind");
   if(!uuid(id)||!["flyer","logo"].includes(kind||""))return bad("invalid_upload",400,origin);
   const {data:edition}=await db.from("kon_editions").select("id,status").eq("id",id).maybeSingle();
   if(!edition||edition.status!=="draft")return bad("draft_required",409,origin);
   const form=await req.formData(),file=form.get("file");
   if(!(file instanceof File)||file.size===0||file.size>10485760)return bad("invalid_file_size",413,origin);
   const ext:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
   if(!ext[file.type])return bad("unsupported_file_type",415,origin);
   const bytes=new Uint8Array(await file.arrayBuffer());
   const good=file.type==="image/png"&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71||
    file.type==="image/jpeg"&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255||
    file.type==="image/webp"&&new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
   if(!good)return bad("file_signature_invalid",415,origin);
   const path="editions/"+id+"/"+kind+"-"+crypto.randomUUID()+"."+ext[file.type];
   const {error:uploadError}=await db.storage.from(bucket).upload(path,bytes,{contentType:file.type,upsert:false,cacheControl:"3600"});
   if(uploadError){console.error(uploadError.message);return bad("media_upload_failed",500,origin);}
   const {data:link}=db.storage.from(bucket).getPublicUrl(path);
   const column=kind==="flyer"?"flyer_url":"logo_url";
   const {data:saved,error:saveErr}=await db.from("kon_editions").update({[column]:link.publicUrl,updated_at:new Date().toISOString()}).eq("id",id).eq("status","draft").select(fields).maybeSingle();
   if(saveErr||!saved)return bad("asset_uploaded_but_draft_not_updated",500,origin);
   return send({ok:true,edition:saved,url:link.publicUrl},200,origin);
  }
  let payload:Record<string,unknown>;
  try{payload=await req.json();if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error();}catch{return bad("invalid_json",400,origin);}
  if(action==="save"){
   let clean:Record<string,unknown>;try{clean=validated(payload);}catch(e){return bad(String(e instanceof Error?e.message:e),400,origin);}
   const id=payload.id;
   if(id){
    if(!uuid(id))return bad("invalid_id",400,origin);
    const {data,error}=await db.from("kon_editions").update({...clean,updated_at:new Date().toISOString()}).eq("id",id).eq("status","draft").select(fields).maybeSingle();
    if(error)return bad(error.code==="23505"?"slug_taken":"save_failed",409,origin);
    if(!data)return bad("draft_required",409,origin);
    return send({ok:true,edition:data},200,origin);
   }
   const {data,error}=await db.from("kon_editions").insert(clean).select(fields).single();
   if(error)return bad(error.code==="23505"?"slug_taken":"create_failed",409,origin);
   return send({ok:true,edition:data},201,origin);
  }
  if(action==="publish"){
   if(!uuid(payload.id)||payload.confirm_slug!==payload.slug||!slug(payload.slug))return bad("publish_confirmation_required",400,origin);
   const {data:edition}=await db.from("kon_editions").select("slug,status").eq("id",payload.id).maybeSingle();
   if(!edition||edition.slug!==payload.slug||edition.status!=="draft")return bad("draft_required",409,origin);
   const {data,error}=await db.rpc("kon_publish_edition",{p_id:payload.id});
   if(error){console.error("publishing prevented",error.code);return bad(error.message.includes("edition_")?error.message:"publish_failed",409,origin);}
   return send({ok:true,edition:data},200,origin);
  }
  return bad("invalid_action",400,origin);
 }catch(e){console.error("kon_editions_error",e);return bad("unexpected_error",500,origin);}
});
