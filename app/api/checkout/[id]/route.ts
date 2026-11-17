import { env,response } from '../../../../lib/server';
import { getCheckout,validCheckoutId } from '../../../../lib/flash-checkout.mjs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validCheckoutId(id))return response({error:'Payment request not found.'},404);
 try{const result=await getCheckout(env,id);return response(result,result.code||200)}catch{return response({error:'Payment status could not be checked. No payment has been confirmed.'},503)}
}
