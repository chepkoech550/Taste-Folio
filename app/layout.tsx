import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Taste Folio · Express your value',description:'Pitch what you can do, make a clear offer, and connect with people who value your skills.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
