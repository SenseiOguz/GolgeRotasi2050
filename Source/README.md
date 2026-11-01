# Gölge Rotası: 2050 — v1.1.0 COP31 4 Bölümlü Demo

COP31 GameUP Türkiye için dört bölümlü eğitsel şehir bulmacası. Sıcak hava dalgasında ilaç taşıyan kuryenin sabit rotasındaki ısı yükünü sınırlı bütçeyle azaltın. Ana tema **İklim Dirençli Şehirler**, yan tema **İklim Değişikliği Odağında Eğitim**.

**Bölüm haritası:** Oyuna Başla ile haritaya girin; açık düğümü seçin. İlk girişte yalnız Yeşil Başlangıç açıktır. Başarı sıradaki bölümü açar; sonuçtan Sonraki Bölüm, Harita veya Yeniden Dene seçilir. Kayıpta planınızı değiştirin.

| Bölüm | Bütçe / yük eşiği | Mekanik |
|---|---|---|
| Yeşil Başlangıç | 150 / 300 | Kısa rota, üç araç öğreticisi |
| Yoğun Mahalle | 180 / 740 | Eski Sıcak Kavşak; üç teslimat durağı |
| Sanayi Krizi | 175 / 738 | Isı dalgası ve yerleşime kapalı inşaat alanları |
| Kritik Eşik | 170 / 740 | Duraklar, dalga, inşaat; en çok 2 ağaç, 4 gölgelik, 2 çatı |

Isı dalgası belirli rota adımlarına ek yük getirir; yıldız eşikleri bölüme özeldir. Bölüm girişleri ve hedef HUD’u yeni mekanikleri açıklar. Haritada kilit açma yolculuğu ve dört bölüm sonunda tamamlanma kutlaması vardır.

**Kayıt ve sıfırlama:** Açılan bölümler, en iyi yük ve yıldızlar aynı tarayıcı/konumun yerel depolamasında (`golge-rotasi-progress-v1`) saklanır. **Ayarlar → İlerlemeyi Sıfırla → Emin misin? İlerlemeyi Sıfırla** ile ilk bölüme dönülür. Depolama engellenirse oturum belleği kullanılır. Başka tarayıcıya veya dosya konumuna kayıt aktarımı garanti edilmez. Ayarlarda azaltılmış hareket seçilebilir.

## Nasıl oynanır? (Bölüm 2 örneği)

1. Bölüm haritasından **Yoğun Mahalle** seçin; 10×6 alanda rotayı ve sıcak noktaları inceleyin.
2. 180 ₺ oyun bütçesiyle **Ağaç** (40 ₺, park/yol), **Gölgelik** (25 ₺, yol) veya **Serin Çatı** (30 ₺, bina) seçip uygun hücreye yerleştirin.
3. **Simülasyonu Başlat** ile kuryeyi izleyin; toplam ısı yükünü **740 veya altına** indirin.
4. Önce/sonra sonucunu karşılaştırın; **Yeniden Dene** ile yeni plan kurun. Planlamada **Geri Al** kullanılabilir.

Kontroller: **fare** seçim/yerleştirme; **1/2/3** araç seçimi, **Space** simülasyon, **Z** geri alma, **H** ısı haritasını aç/kapa. Ses ayarlarından ses, seviye ve şehir ambiyansı değiştirilebilir.

## Pixel Edition

- Menüde sıcaktan serine gölge dalgası; ortak paletli piksel arayüz ve okunaklı yerel rakam fontu.
- Konut, apartman, ticari bina, ofis, depo ve hastaneyle çeşitli piksel şehir; dekor ve soluk çevre halkası.
- Oyun modelinin gerçek `computeHeat` çıktısına bağlı ısı haritası; ağaç/gölgelik yerleştirme efektleri ve serin çatı dönüşümü.
- Dört yönde kurye yürüyüşü, bekleme ve teslim animasyonları; sonuçta önce/sonra ısı haritaları, müdahale sayıları ve kayıpta en sıcak üç rota noktası.
- Özgün prosedürel ses efektleri ve ısı yüküne tepki veren şehir ambiyansı; WebAudio yoksa sessiz devam.

**Yıldız sistemi:** Başarılı teslimatlar 1–3 yıldız kazanır; ısı eşiğinin altındaki pay, korunan bütçe ve harcanan bütçe başına ısı azaltımı değerlendirilir. Referans plan 732/740 ile 1 yıldız; yedi gölgelik planı 702/740 ile 3 yıldız verir. Kazanma eşiği değişmez; kayıpta yıldız gösterilmez.

## Kurulum ve çalıştırma

Node.js 22.12+, 24.x veya 26+ ve npm gerekir. PowerShell kısıtlıysa `npm.cmd` kullanın.

```sh
npm ci
npm run dev
npm run build
npm test
npm run lint
npm run build:single
npm run qa:assets
npm run preview
```

Vite'ın verdiği yerel adresi açın. Normal build `dist/` üretir; `npm run preview` ile oynanır. **Çevrimdışı tek dosya:** `build:single` sonrası `dist/offline/index.html` dosyasını Chrome'da doğrudan açın; internet veya sunucu gerekmez. Normal build `dist/` içini yeniler; iki çıktı için önce `build`, sonra `build:single` çalıştırın. Adrese **`?classic=1`** eklemek MVP'nin prosedürel görünümünü açar; eksik piksel dokularda otomatik geri dönüş vardır.

Teknoloji: **Phaser 3.90.0 + TypeScript + Vite**, Vitest, ESLint ve vite-plugin-singlefile. Backend veya oyun sırasında harici veri servisi gerekmez. Varlık kökenleri, PixelLab kullanım notu ve font atıfları: [ASSETS_LICENSE.md](ASSETS_LICENSE.md). Bu belge kaynak koda yeni lisans atamaz.

**Eğitsel uyarı:** Isı haritası dış meteoroloji ölçümü değildir. Basitleştirilmiş deterministik oyun modeli bilimsel sıcaklık, iklim veya sağlık tahmini yapmaz; gerçek müdahale etkileri yerel koşullara göre değişir.

[Uygulama raporu](IMPLEMENTATION_REPORT.md) · [Sekiz slayt ve kısa tanıtım](docs/SUNUM_METNI.md)
