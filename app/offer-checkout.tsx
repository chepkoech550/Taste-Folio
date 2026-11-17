'use client';
import {useEffect,useRef,useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {usdLabel} from '../lib/checkout-contract.mjs';

type Checkout={id:string;stage:string;paymentStatus:string|null;offerTitle:string;sellerName:string;recipient:string;usdCents:number;paymentRequest?:string;millisatoshis?:string;expiresAt?:number;retryAt:number;error?:string};
type Props={slug:string;offerId:string;price:string;recipient:string;preview?:boolean};
export default function OfferCheckout(p:Props){
 const dialog=useRef<HTMLDialogElement>(null),activeId=useRef('');
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[record,setRecord]=useState<Checkout|null>(null),[error,setError]=useState(''),[now,setNow]=useState(Date.now()),[copied,setCopied]=useState(false);
 const storageKey='taste-folio-checkout:'+JSON.stringify([p.slug,p.offerId,p.price,p.recipient]);
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();if(!open&&dialog.current?.open)dialog.current.close()},[open]);
 useEffect(()=>{if(!open)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[open]);
 async function refresh(){if(!activeId.current)return;try{const res=await fetch('/api/checkout/'+activeId.current);const body=await res.json() as {checkout?:Checkout;error?:string;statusUnavailable?:boolean};if(!res.ok||!body.checkout){setError(body.error||'Payment status is unavailable. No payment has been confirmed.');return}setRecord(body.checkout);setError(body.statusUnavailable?'Flash could not confirm the latest status. Check again before making another payment.':'')}catch{setError('Payment status could not be checked. Check again before making another payment.')}}
 useEffect(()=>{if(!open||!record||record.paymentStatus==='PAID'||record.paymentStatus==='EXPIRED'||record.stage==='failed')return;const timer=setInterval(refresh,8000);return()=>clearInterval(timer)},[open,record?.id,record?.stage,record?.paymentStatus]);
 async function begin(fresh=false){
  setOpen(true);setBusy(true);setError('');setCopied(false);
  let id=activeId.current;
  if(!fresh&&!id){try{id=sessionStorage.getItem(storageKey)||''}catch{}}
  if(fresh||!id){id=crypto.randomUUID();try{sessionStorage.setItem(storageKey,id)}catch{}}
  activeId.current=id;setRecord(null);
  try{const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,slug:p.slug,offerId:p.offerId})});const body=await res.json() as {checkout?:Checkout;error?:string};if(!res.ok||!body.checkout)throw new Error(body.error||'The invoice could not be created.');setRecord(body.checkout)}catch(e){setError(e instanceof Error?e.message:'The request failed. Retry the same request before starting another.')}finally{setBusy(false)}
 }
 const expired=!!record?.expiresAt&&now>=record.expiresAt;
 const payable=record?.stage==='ready'&&record.paymentStatus==='PENDING'&&!expired&&!!record.paymentRequest;
 const seconds=record?.expiresAt?Math.max(0,Math.ceil((record.expiresAt-now)/1000)):0;
 async function copy(){try{await navigator.clipboard.writeText(record?.paymentRequest||'');setCopied(true)}catch{setError('Copy unavailable. Select and copy the invoice below.')}}
 return <><button className="primary" disabled={p.preview} onClick={()=>begin()}>Pay with Lightning</button>
 <dialog ref={dialog} className="lightning-dialog" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} aria-labelledby={'checkout-title-'+p.offerId}>
  <button className="checkout-close" aria-label="Close Lightning checkout" onClick={()=>setOpen(false)}>×</button>
  <span className="eyebrow">Lightning checkout</span><h2 id={'checkout-title-'+p.offerId}>{record?.offerTitle||'Pay for this offer'}</h2>
  {busy&&<p role="status">Creating your invoice…</p>}
  {error&&<p role="alert" className="checkout-error">{error}</p>}
  {record&&<><p className="checkout-price">{usdLabel(record.usdCents)}</p><p>To {record.sellerName}<br/><strong>{record.recipient}</strong></p><p className="muted">You pay Bitcoin over Lightning. The recipient receives USD in Flash’s Cash Wallet. Agree delivery directly with the professional.</p>
   {record.paymentStatus==='PAID'?<div role="status" className="checkout-paid"><strong>Payment confirmed</strong><p>Flash confirms this invoice is paid. Keep your payment reference: {record.id}.</p></div>:record.stage==='failed'?<p role="status">{record.error}</p>:record.stage==='creating'?<p role="status">Your request is being checked. No payment has been confirmed.</p>:<>
    <p role="status">{record.paymentStatus==='EXPIRED'?'Invoice expired':expired?'Payment window ended. Check payment status before starting again.':'Awaiting payment · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}</p>
    {payable&&<><div className="checkout-qr"><QRCodeSVG value={record.paymentRequest!.toUpperCase()} size={256} marginSize={4} level="M" title={'Lightning invoice for '+usdLabel(record.usdCents)}/></div><div className="checkout-actions"><a className="button primary" href={'lightning:'+record.paymentRequest}>Open Lightning wallet</a><button onClick={copy}>{copied?'Copied':'Copy invoice'}</button></div><details><summary>Show invoice</summary><textarea readOnly value={record.paymentRequest} aria-label="Lightning invoice"/></details></>}
   </>}
   {record.paymentStatus!=='PAID'&&<button onClick={refresh}>Check payment status</button>}
   {record.paymentStatus!=='PAID'&&(record.paymentStatus==='EXPIRED'||expired||now>=record.retryAt)&&<button disabled={busy} onClick={()=>begin(true)}>Create a new invoice</button>}
  </>}
  {!record&&!busy&&<button onClick={()=>begin()}>Retry this request</button>}
 </dialog></>;
}
