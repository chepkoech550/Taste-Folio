# QR sharing and simple tipping

The product keeps three additions: one tip toggle, a portfolio QR download and
one business-card layout. Videos continue to use existing project evidence links.
There is no separate poster designer, custom tip message or card editing form.

## For the portfolio owner

1. In Work & contact, add M-Pesa or Lightning receiving details.
2. Turn on Accept tips for my work if wanted. At least one receiving method is
   required before publishing a tipping profile.
3. Add a performance clip through a project's evidence link.
4. Publish the portfolio. In Review & publish, choose Get QR code & business card.
5. Download the QR SVG for your own cards or signs, or print the supplied card sheet.

## For a visitor

The QR opens the portfolio. A tipping profile shows Leave a tip and Book me.
Leave a tip expands the receiving details; the visitor chooses an amount and pays
in their wallet. Booking opens the professional's email or WhatsApp contact.
Share portfolio keeps copy, QR and print actions together in one collapsed menu.
Taste Folio does not create a payment prompt, process a tip or confirm payment.
Flash checkout remains a separate pending integration.

## Printing

The card page reads the current published snapshot. Saved draft changes cannot
appear on a card until republished. No private draft or payment fields are included
in the card. It shows the published name, headline, contact and QR code.

The sheet contains ten 85 x 55 mm cards on A4 with 10 mm page margins. Print at
100% / actual size, with browser headers and footers off. Save as PDF is available
through the browser print dialog. Check the preview for long names/headlines,
which may be shortened to fit. Test one printed card with a phone before a batch.
The SVG includes a white quiet zone and can be resized without losing resolution.

QR codes use the production portfolio URL from lib/portfolio-links.ts, never a
preview or localhost address. The slug stays stable through edits and republishing.
Keep the portfolio published and hosting active. Unpublishing makes both the profile
and card page unavailable. Preserve redirects if changing the production domain.

No database migration or new runtime secrets are required for these additions.
