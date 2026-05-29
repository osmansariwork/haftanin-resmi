# Kurulum (5 adım, ~20 dakika)

## 1. Supabase projesi oluştur
1. [supabase.com](https://supabase.com) → **Start your project** → Google ile giriş yap
2. **New project** → isim ver (örn. `haftanin-resmi`) → şifre belirle → **Create new project**
3. Proje açılana kadar 1-2 dakika bekle

## 2. Veritabanını kur
1. Sol menüde **SQL Editor** → **New query**
2. `setup.sql` dosyasının içeriğini kopyala → yapıştır → **Run**
3. "Success" mesajı gözükürse tamam

## 3. API bilgilerini al
1. Sol altta **Project Settings** (⚙️) → **API**
2. Şunları kopyala:
   - **Project URL** → `https://xxxxx.supabase.co` formatında
   - **anon / public** key (uzun bir metin)

## 4. config.js'i güncelle
`config.js` dosyasını aç ve bilgileri gir:
```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'buraya-anon-key-gelecek';
```

## 5. GitHub Pages'e yükle
1. GitHub'da yeni bir **public** repository oluştur (örn. `haftanin-resmi`)
2. Bu klasördeki dosyaları hepsini yükle (git push veya drag-drop)
3. Repository → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main** → **Save**
4. Birkaç dakika sonra `https://[kullanıcı-adın].github.io/haftanin-resmi` adresinde yayında

---

## Şifreler
| Kişi | Şifre |
|------|-------|
| Osman | `osman1234` |
| Fatya | `fatya1234` |

Şifreyi değiştirmek istersen `app.js` dosyasında `USERS` nesnesini düzenle.
