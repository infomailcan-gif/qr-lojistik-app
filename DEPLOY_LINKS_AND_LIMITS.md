# QR Lojistik App – Deploy linkleri ve Supabase limitleri

## Vercel linkleri

| Açıklama | Link |
|----------|------|
| **Vercel proje paneli** | https://vercel.com/infomailcan-9000s-projects/qr-lojistik-app |
| **Production (ana)** | https://qr-lojistik-app.vercel.app |
| **Production (team)** | https://qr-lojistik-app-infomailcan-9000s-projects.vercel.app |
| **Özel alan adları** | https://canberk.tech · https://www.canberk.tech · https://hlbursa.tech · https://www.hlbursa.tech |

**Yeni deploy:** Repo’ya push yaptığınızda Vercel otomatik deploy alır. Manuel deploy için proje klasöründe `vercel login` ardından `vercel deploy --prod` çalıştırın.

---

## Dip not: Supabase limitleri (Free Plan)

QR Lojistik App, **Supabase Free Plan** ile çalışıyor. Önemli limitler:

| Kaynak | Free plan limiti | Açıklama |
|--------|------------------|----------|
| **Egress** | 5 GB / ay | Veritabanından dışarı çıkan veri. Aşılırsa grace period sonrası 402 ve kısıtlama riski. |
| **Cached Egress** | 5 GB / ay | CDN üzerinden çıkan veri. |
| **Database size** | 0,5 GB | Toplam veritabanı boyutu. |
| **Storage size** | 1 GB | Depolama alanı. |
| **Realtime eşzamanlı bağlantı** | 200 | Aynı anda Realtime bağlantı sayısı. |
| **Realtime mesaj** | 2.000.000 / ay | Aylık mesaj kotası. |
| **MAU (Monthly Active Users)** | 50.000 | Auth ile aylık aktif kullanıcı. |
| **Edge Function çağrısı** | 500.000 / ay | Aylık Edge Function invocations. |

**API satır limiti:** PostgREST tek istekte **en fazla 1000 satır** döndürür. Bu yüzden koli listesi uygulamada sayfalı (1000’er) çekiliyor; 1000’den fazla koli doğru görünür.

**Supabase dashboard:** https://supabase.com/dashboard (proje: **QR Lojistik App 2026**)

---

*Son güncelleme: Şubat 2026*
