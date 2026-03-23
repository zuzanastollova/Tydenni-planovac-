import './globals.css'

export const metadata = {
  title: 'Týdenní Plánovač',
  description: 'AI asistent pro plánování tvého týdne',
}

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
