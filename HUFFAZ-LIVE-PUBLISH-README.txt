HUFFAZ EXCLUSIVE HQ — LIVE PUBLISH PACKAGE

Files:
- index.html = final customer website
- _worker.js = Cloudflare Pages API worker
- admin.html + admin.js = private mobile-friendly order dashboard

Publish:
1. Replace the current website index.html with this index.html.
2. Replace the current _worker.js with this _worker.js.
3. Add/replace admin.html and admin.js.
4. Keep existing Cloudflare environment variables/secrets unchanged:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ADMIN_TOKEN
5. Commit/push to the existing GitHub main branch. Cloudflare Pages should deploy automatically.
6. Customer website remains at the existing Pages domain. Admin dashboard is /admin.html.

Submit Order flow:
- validates quantity/name/WhatsApp
- uploads optional design
- creates Pending order in Supabase
- generates HEQ reference
- calculates 50% deposit
- opens WhatsApp with the order summary

Admin dashboard:
- search/filter orders
- status: Pending, Design, Production, Ready, Completed, Cancelled
- view customer/order details
- update paid amount and balance
- add admin notes
- open customer WhatsApp

No payment gateway was added. Payment remains manual via the HUFFAZ payment process after quotation confirmation.
