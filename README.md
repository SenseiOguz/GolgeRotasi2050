# Gölge Rotası: 2050 — v1.1.0

Sıcak bir şehirde kurye rotasını ağaç, gölgelik ve serin çatılarla koru. Bütçeyi planla, simülasyonu izle, dört bölümü tamamla ve 12 yıldızı kazan.

## Oyna

Windows: `Game\GolgeRotasi2050-win32-x64\GolgeRotasi2050.exe` dosyasını aç.
Tarayıcı: `Web\GolgeRotasi2050-v1.1.0-offline.html` dosyasını Chrome ile aç; internet gerekmez. Statik sunucu seçeneği için `Web\HOW_TO_RUN.txt` dosyasına bak.

Fareyle araç seç ve uygun hücreye yerleştir. 1: ağaç, 2: gölgelik, 3: serin çatı. H: ısı haritası, Esc: açık yardım kartını kapat. Hazır olduğunda **Simülasyonu Başlat** düğmesine bas. Haritada ok tuşlarıyla bölüm seç, Enter ile oyna.

Bölümler: Yeşil Başlangıç, Yoğun Mahalle, Sanayi Krizi ve Kritik Eşik. Teslimatlar, inşaat alanları, ısı dalgası ve araç limitleri ilerledikçe planını zorlaştırır. Oyun eğitsel bir modeldir; bilimsel iklim veya sağlık tahmini değildir.

## Klasörler

- `Game`: Windows uygulaması ve taşınabilir ZIP.
- `Web`: çevrimdışı HTML ve statik web dağıtımı.
- `Gameplay`: gerçek oynanış videosu ve 1920×1080 ekran görüntüleri.
- `Source`: geliştirme ve derleme için kaynak kodu.

## Geliştir

Node.js 22 veya üzeriyle `Source` klasöründe:

```text
npm ci
npm run dev
npm run build
npm test
npm run lint
npm run build:single
npm run qa:assets
```

Vite geliştirme adresini terminalden aç. Standart derleme `dist`, tek dosya derlemesi `dist/offline` üretir. Geliştirici ayrıntıları: `Source\README.md`.

Lisans ve görsel/font atıfları: [Source/ASSETS_LICENSE.md](Source/ASSETS_LICENSE.md).
Geçmiş belgeler, raporlar, eski medya ve yedekler: [Arşiv dizini](../GolgeRotasi2050_Archive/ARCHIVE_INDEX.md).
