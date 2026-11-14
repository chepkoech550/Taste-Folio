import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Taste Folio · Your work, clearly presented',description:'Publish your skills, show evidence of your work, and connect with clients and employers.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
