# DOH-R — Simple DoH proxy for Railway

این مخزن یک پروکسی ساده برای DNS-over-HTTPS است که درخواست‌های دریافتی روی مسیر `/dns-query` را به آدرس DoH آپ‌استریم شما فوروارد می‌کند.

نکته مهم: نام مخزن بهتر است بدون فاصله باشد (مثلاً `DOH-R` یا `DOH_R`).

## پیکربندی
تنها متغیر محیطی مورد نیاز:
- `DOH_UPSTREAM` — آدرس کامل DoH آپ‌استریم شما، مثال:
  - `https://your.doh.server/dns-query`
  - یا اگر resolver از JSON پشتیبانی می‌کند: `https://dns.google/dns-query`

## مسیرها
- GET /dns-query — فوروارد کوئری‌استرینگ به آپ‌استریم
- POST /dns-query — فوروارد بادی باینری (application/dns-message) به آپ‌استریم
- GET /health — بررسی سلامت ساده

## اجرا محلی
1. Node 18+ نصب باشد.
2. متغیر محیطی را ست کنید و اجرا کنید:
```bash
export DOH_UPSTREAM="https://your.doh.server/dns-query"
npm install
npm start
```

## ساخت تصویر Docker
```bash
docker build -t doh-r .
docker run -e DOH_UPSTREAM="https://your.doh.server/dns-query" -p 3000:3000 doh-r
```

## دیپلوی روی Railway
1. یک مخزن GitHub با نام دلخواه (مثلاً `DOH-R`) بسازید و این فایل‌ها را push کنید.
2. وارد Railway شوید و "New Project" → "Deploy from GitHub" را انتخاب کنید.
3. مخزن را متصل کنید و در تنظیمات Environment Variables مقدار `DOH_UPSTREAM` را با آدرس DoH خودتان ست کنید.
4. Deploy را بزنید. Railway آدرس HTTP ای به شما می‌دهد (مثلاً `https://your-project.up.railway.app`).

## تست بعد از دیپلوی
نمونه تست با GET (DNS JSON یا application/dns-message بسته به resolver):
```bash
# تست با header که پاسخ JSON درخواست کند
curl -v -H 'accept: application/dns-json' 'https://your-deploy-url/dns-query?name=example.com&type=A'

# یا تست با binary DoH (POST)
# آماده‌سازی body باینری لازم است؛ برای تست ساده می‌توانید از dig +doq یا ابزارهای دیگر استفاده کنید.
```

## نکات امنیتی و عملکرد
- این پروکسی صرفاً فوروارد می‌کند؛ لاگ‌ها و ریکوئست‌ها ممکن است در Railway ثبت شوند—اگر حفظ حریم خصوصی خیلی مهم است، ملاحظه کنید که resolver شما چه لاگ‌هایی نگه می‌دارد.
- برای حجم بالا یا production، اضافه‌کردن cache، rate-limit و احراز هویت را در نظر بگیرید.
