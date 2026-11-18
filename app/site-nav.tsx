type Destination = 'talent' | 'opportunities' | 'work' | 'pitch';

export default function SiteNav({signedIn=false,current}:{signedIn?:boolean;current?:Destination}) {
 return <header>
  <a className="brand" href="/">Taste Folio<span>.</span></a>
  <nav aria-label="Main navigation">
   <a href="/" aria-current={current==='talent'?'page':undefined}>Find talent</a>
   <a href="/opportunities" aria-current={current==='opportunities'?'page':undefined}>Find paid work</a>
   {signedIn&&<a href="/work" aria-current={current==='work'?'page':undefined}>My work</a>}
   <a href="/edit" aria-current={current==='pitch'?'page':undefined}>{signedIn?'My pitch':'Create a pitch'}</a>
  </nav>
 </header>;
}
