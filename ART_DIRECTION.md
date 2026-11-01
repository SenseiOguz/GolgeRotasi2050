## 4. Sanat yönetimi (Art Bible) — bağlayıcı kurallar

### 4.1 Stil cümlesi
> "2050'de sıcak hava dalgasıyla mücadele eden, umutlu bir Akdeniz kenti: güneşle ağarmış beton ve sıcak asfalt; dikey bahçeler, güneş paneli gölgelikler, beyaz serin çatılar ve turkuaz yapraklarla serinleyen sokaklar. Temiz, okunaklı, sıcak-soğuk kontrastı güçlü, 'cozy' ama ciddi bir solarpunk pixel-art."

### 4.2 Perspektif
- **Tek perspektif: yüksek tepeden (PixelLab `view: "high top-down"`).** Çatılar görünür, ön cephe en fazla 16 native px (bina sprite'ı 40×56: 40×40 taban + 16 px yukarı taşma).
- Ağaç: taç kareyi en fazla %90 kaplar; **gövde tacın altında en fazla 4 native px görünür**, gövde tabanı karenin alt-orta noktasına (20, 36) hizalanır. Gövde **opak**, taçtan ayrı ve şeffaf boşluksuz çizilir.
- Kurye: 4 yön (S, E, N, W); W yönü E'nin aynası olabilir (hak tasarrufu).
- İzometrik, yandan veya alçak 3/4 açı **yasak.** Açısı uymayan çıktı reddedilir.

### 4.3 Işık
- **Tek ışık yönü: sol üstten (kuzeybatı), öğleden sonra güneşi.** Vurgular nesnelerin sol-üst kenarında, koyu tonlar sağ-alt kenarında.
- Gölgeler sağ-alta düşer. Gölge **görsele işlenmez** (bkz. 4.4).

### 4.4 Gölge kuralı (PixelLab testindeki sorunun çözümü)
- Asset'lerde **zemin gölgesi yok.** Gölgeleri motor çizer: sprite siluetinin `#0B1320` ile doldurulmuş, %35 opak kopyası, ekranda (+6, +4) px kaydırılmış. Böylece her nesnede gölge yönü ve yoğunluğu aynı olur.
- Ağaç ve gölgelikler ayrıca altlarındaki kareye "serin gölge" deseni bırakır. Bu desen oyundaki etki alanıyla aynı karelere düşer ve mekaniği görselleştirir.

### 4.5 Şeffaflık ve kenar kuralları (PixelLab testindeki sorunun çözümü)
- Alfa **yalnızca 0 veya 255.** Yarı saydam piksel yok; düzeltme `correct_pixelart` ile yapılır.
- Arka plan tamamen şeffaf (`no_background: true`). Zemin kareleri (yol, park, su) ise tamamen opaktır.
- **Kenar boşluğu:** nesne sprite'larında her yönde en az 2 native px şeffaf boşluk (testte taç kenara dayanıyordu). Zemin kareleri kenardan kenara çizilir ve dikişsizdir.
- Gövde, direk, kurye bacağı gibi ince parçalarda delik veya şeffaf boşluk olmaz; QA script'i "iç şeffaf delik" taraması yapar.

### 4.6 Ana palet (32 renk, tek kaynak) — renk dağınıklığının çözümü
Tüm asset'ler bu palete **zorunlu olarak** oturtulur: PixelLab'da `palette` parametresi verilir, ardından `reduce_colors(palette_image=palette32.png)` uygulanır. QA script'i palet dışı tek bir pikseli bile hata sayar.

| Rampa | Renkler |
|---|---|
| Gece/lacivert (zemin, kontur) | `#0B1320` `#101C2C` `#1B3044` `#2A4559` `#3D5F73` |
| Beton/asfalt (nötr) | `#4A5560` `#66717A` `#8C959B` `#B7BEC0` `#ECF4F6` |
| Yaprak (serin) | `#12382F` `#1E5A47` `#2E7D5B` `#43C6A5` `#7FE0B8` `#C6F2D8` |
| Isı (sıcak) | `#5C2A2E` `#A23E3A` `#F87852` `#F4A259` `#F0C35C` `#FFE6A3` |
| Toprak/ahşap/terakota | `#3D2E35` `#6B4A3A` `#9C7856` `#C9A57A` |
| Güneş paneli/su/cam | `#1F4E79` `#2F7FA8` `#6EC6E6` |
| Serin çatı/çiçek vurgusu | `#D9E8E4` `#B05FA0` `#E86A92` |

- Mevcut UI renkleri (`#101C2C #F87852 #F0C35C #43C6A5 #ECF4F6`) paletin parçasıdır; MVP ile görsel süreklilik korunur.
- **Asset başına renk sınırı:** küçük nesne/ikon ≤ 12, bina/karakter ≤ 16, menü katmanı ≤ 24.
- **Kontur:** 1 px, `#0B1320` (saf siyah yok). İç kontur yalnızca tonla (selective outline).
- **Doku:** dither yalnızca ısı katmanında ve gökyüzünde. Nesnelerde düz renk blokları.

### 4.7 Sıcaklık dili
- Sıcak durum: ağarmış asfalt `#8C959B`, çatlaklar; kurumuş sarı çim `#C9A57A`/`#F0C35C`; koyu katran çatılar ve klima üniteleri; ısı dalgalanması.
- Serin durum: gölgelenmiş asfalt `#4A5560`, turkuaz yapraklar, beyaz serin çatı `#D9E8E4` ve güneş paneli; çiçek vurguları.
- **Dönüşüm kuralı:** müdahale bir karenin ısısını eşik bandının altına indirince kare "sıcak" sprite'tan "serin" sprite'a 300 ms'lik piksel dither geçişiyle döner; yaprak parçacıkları çıkar ve ısı dalgalanması durur.

### 4.8 Tipografi
- **Pixelify Sans** (SIL OFL 1.1, Türkçe karakter desteği; ğ ş ı İ ç ö ü QA'da tek tek kontrol edilir). Dosya repoya gömülür, CDN kullanılmaz.
- Boyutlar ×2 ızgaraya uyar: başlık 64/48, alt başlık 32, gövde 20/16, küçük 12 (ekran px).
- PixelLab `create_font` kullanılmaz: yalnızca 80 glif üretiyor, Türkçe karakter riski var.

### 4.9 Kabul kontrol listesi (her asset)
Boyut doğru · ×2 ölçekte keskin · palet içi · alfa 0/255 · ≥ 2 px boşluk (nesneler) · perspektif yüksek tepeden · ışık sol üstten · gölge işlenmemiş · referans setle yan yana tutarlı · manifest kaydı var.

---


## Dosya ve manifest sözleşmesi

Dosya: `src/assets/pixel/<area>/<category>/<name>[_<state>][_<frame|dir>].png`. Alanlar world/ui; kategoriler tiles, objects, characters, icons, menu. Dosya kökündeki alt çizgiler anahtar için tireye çevrilir; açık manifest anahtarı önceliklidir.

Native kare ölçüler: 8, 16, 20, 24, 40, 48, 56, 80. Nesne 40×48, bina 40×56, kurye 48×48. Menü: 640×360, 640×120, 640×160, 640×100. Konsept 512×288 ve palet 32×1 yalnızca art/** altında tutulur.

Her runtime PNG sanat worker'ının yazdığı `art/<area>/manifest.json` içinde listelenir. Dosya repo köküne göre; anchor normalize [0,1] koordinatıdır (tüketiciler uygular). frames statik görselde 1, sheet'te frame sayısıdır. Sheet'te frameWidth/frameHeight zorunludur; nativeSize frame boyutudur. QA padding'i her frame'e uygular.

```json
{"assets":[{"key":"tool-tree","file":"src/assets/pixel/world/objects/tool-tree.png","nativeSize":{"width":40,"height":48},"frames":1,"anchor":{"x":0.5,"y":1}}]}
```

Sheet örneği: frames:6, frameWidth:48, frameHeight:48, nativeSize:{width:48,height:48}. PNG boyutları frame boyutlarının tam katıdır. Anahtarlar textureKeys.ts ve pixelKeys.ts ile sınırlıdır. Eksik dosya build'i bozmaz; QA manifest tutarsızlığını hata sayar. ?classic=1 pixel yüklemeyi kapatır. Global pixel render F1'de kapalıdır.

## V2 sanat yönü ve bütünlük

- Görünüm aydınlık, güneşli, canlı ama dengeli olmalıdır. Aşırı koyu veya soluk renklerden kaçınılır; teknik kontrol paneli görünümünden uzaklaşılır.
- Petrol mavisi, turkuaz, yaprak yeşili, altın sarısı ve mercan vurgular kullanılır. Lacivert kontur ve gölgeler içindir. Bu yönlendirme yukarıdaki 32 renkli ana paletle uygulanır.
- Üretilen görsellerin içine yazı işlenmez. Bütün Türkçe metinler gerçek Phaser text nesneleridir.
- Menü, oyun, HUD, yardım, ayarlar ve sonuç sahneleri aynı oyunun parçaları gibi görünmelidir: ortak palet, ışık, perspektif ve piksel yoğunluğu kullanılır.
- Eksik görsel oyunu durdurmaz; MVP anahtarları prosedürel dokuyla tamamlanır. Ses kullanılamadığında sessiz geri dönüş zorunludur.
- `npm run assets:manifest`, runtime PNG'leri ve alan manifestlerini okuyarak kökteki `ASSET_MANIFEST.md` tablosunu yeniden üretir. Bu dosya elle düzenlenmez.

## F2 anahtar sözleşmesi

Aşağıdaki ölçüler native tuval/frame ölçüleridir; ekranda ×2 uygulanır. Gelecek dosyalar yokken registry boş kaydı yüklemez. Statik courier S için `courier`; diğer yönler `courier-e/n/w`. World staging dosyalarını ART-WORLD runtime'a taşır; bu commit yalnız UI pending dosyalarını taşır. `road_v[_hot|_cool]` ve `road_corner_<dir>[_hot|_cool]` dosya kökleri tile-road anahtarlarına eşlenir; açık manifest anahtarı önceliklidir.

| Anahtarlar | Native ölçü |
|---|---|
| tile-road-v, tile-road-corner-es/en/ws/wn (her biri ayrıca -hot, -cool) | 40×40 |
| courier, courier-e, courier-n, courier-w | 48×48 |
| bldg-house/apartment/commercial/office-hot, bldg-house/apartment/commercial/office-coolroof, bldg-hospital, bldg-depot | 40×56 |
| tile-lot, tile-water-h | 40×40 |
| tool-cool-roof | 40×56 |
| courier-walk-s/e/n/w, courier-idle-s, courier-deliver | 48×48 frame; sheet frame sayısı manifestte |
| menu-sky-hot, menu-clouds, menu-clouds-hot, menu-haze-hot | 640×360 |
| menu-skyline-hot, menu-midground-hot | 640×160 |
| menu-foreground-hot | 640×100 |
| ui-badge-9 | 24×14 |
| icon-tree, icon-canopy, icon-cool-roof, icon-heatmap | 24×24 |
| ui-logo-plate, ui-logo-2050 | 320×80, 160×80 (yalnız dekor/plaka; metin Phaser text) |

Mevcut anahtarlar korunur. Aşağıdaki liste pixelKeys.ts içindeki tam sözleşmedir (tool-cool-roof ayrıca mevcut TEXTURE_KEYS alias'ıdır):

`tile-road-hot`, `tile-road-cool`, `tile-park-dry`, `tile-park-lush`, `bldg-a-hot`, `bldg-a-coolroof`, `bldg-b-hot`, `bldg-b-coolroof`, `bldg-c-hot`, `bldg-c-coolroof`, `courier-idle`, `courier-walk-s`, `courier-walk-e`, `courier-walk-n`, `courier-walk-w`, `tree-sway`, `water-flow`, `ui-panel-9`, `ui-tool-card`, `ui-heat-gauge`, `ui-result-frame`, `btn-primary-normal`, `btn-primary-hover`, `btn-primary-pressed`, `btn-primary-disabled`, `btn-secondary-normal`, `btn-secondary-hover`, `btn-secondary-pressed`, `btn-secondary-disabled`, `btn-danger-normal`, `btn-danger-hover`, `btn-danger-pressed`, `btn-danger-disabled`, `icon-budget`, `icon-thermometer`, `icon-star-full`, `icon-star-empty`, `icon-sound-on`, `icon-sound-off`, `icon-undo`, `icon-play`, `icon-menu`, `icon-help`, `icon-settings`, `icon-confirm`, `icon-warning`, `icon-leaf`, `icon-sun`, `menu-sky`, `menu-skyline`, `menu-midground`, `menu-foreground`, `menu-sun`, `menu-emblem`, `tile-road-v`, `tile-road-v-hot`, `tile-road-v-cool`, `tile-road-corner-es`, `tile-road-corner-es-hot`, `tile-road-corner-es-cool`, `tile-road-corner-en`, `tile-road-corner-en-hot`, `tile-road-corner-en-cool`, `tile-road-corner-ws`, `tile-road-corner-ws-hot`, `tile-road-corner-ws-cool`, `tile-road-corner-wn`, `tile-road-corner-wn-hot`, `tile-road-corner-wn-cool`, `courier-e`, `courier-n`, `courier-w`, `menu-sky-hot`, `menu-skyline-hot`, `menu-midground-hot`, `menu-foreground-hot`, `menu-clouds`, `menu-clouds-hot`, `menu-haze-hot`, `ui-badge-9`, `icon-tree`, `icon-canopy`, `icon-cool-roof`, `icon-heatmap`, `bldg-house-hot`, `bldg-house-coolroof`, `bldg-apartment-hot`, `bldg-apartment-coolroof`, `bldg-commercial-hot`, `bldg-commercial-coolroof`, `bldg-office-hot`, `bldg-office-coolroof`, `bldg-hospital`, `bldg-depot`, `tile-lot`, `tile-water-h`, `tool-cool-roof`, `courier-idle-s`, `courier-deliver`, `ui-logo-plate`, `ui-logo-2050`.

`HEATMAP_TOGGLED` payload: `{ visible: boolean }`; UI → Game ve H klavye davranışı aynı sözleşmeyi kullanır. Uygulayıcılar PX-UI/PX-GAME; renderer sahipliği yeniden PX-GAME'dedir.

### F2 UI sonuç / ayar parçaları (ek sözleşme)

| Anahtarlar | Native boyut | Nine-slice kenarı |
|---|---|---|
| icon-result-success, icon-result-fail | 48×48 | — |
| ui-toggle-on, ui-toggle-off | 40×40 | — |
| ui-slider-track, ui-slider-fill | 24×24 | her yönde 3 px |
| ui-slider-knob | 16×16 | — |
| icon-close | 24×24 | — |
| ui-toast-9, ui-toast-warn-9, ui-toast-error-9 | 24×24 | her yönde 4 px |

11 dosya, `art/ui/processed/pending_keys` altından byte değiştirilmeden runtime'a taşındı. `icon-*` → `src/assets/pixel/ui/icons/`; `ui-*` → `src/assets/pixel/ui/frames/`. Tam manifest kayıtları anchor, nativeSize, frames ve nineSlice bilgilerini korur.

### F2 dekor anahtarları

| Anahtarlar | Native boyut | Kategori / anchor |
|---|---|---|
| decor-bench, decor-lamp, decor-bush, decor-planter, decor-sign | 24×24 | world/objects; bottom-center (0.5, 1) |

Dosyalar `art/world/staging/decor` altından `git mv` ile byte değiştirilmeden `src/assets/pixel/world/objects` altına taşındı. Nesne QA kuralları (palet, alfa 0/255, en az 2 px şeffaf padding ve iç delik taraması) geçerlidir. Bu kayıt, dekorların sahneye yerleştirilmesi anlamına gelmez.

## 4 bölümlü demo: map alanı ve yeni anahtarlar

| Anahtarlar | Native boyut | Alan / kural |
|---|---|---|
| map-bg | 640×360 | map; tamamen opak |
| map-node-open, map-node-current, map-node-done, map-node-locked | 32×32 | map; yalnız bu düğümler için 32 px istisnası |
| map-path-dot | 8×8 | map |
| bldg-factory-hot, bldg-factory-coolroof, bldg-warehouse-hot, bldg-warehouse-coolroof | 40×48 | world/objects |
| tile-construction | 40×40 | world/tiles |
| decor-cone | 24×24 | world/objects; en az 2 px şeffaf padding ve iç delik taraması |
| icon-heatwave, icon-delivery | 24×24 | ui/icons |

Harita runtime alanı: `src/assets/pixel/map/**`; alan manifesti: `art/map/manifest.json` (mevcut assets şeması). Eksik alan ve eksik dosyalar geçerlidir. Tüm PNG'ler eager Vite URL glob'una dahildir; açık manifest anahtarı dosya adından önceliklidir. İsteğe bağlı `src/assets/pixel/map/map-layout.json`, hard import yerine eager JSON glob ile yüklenir; tüketiciler `pixelManifest.ts` içindeki `MAP_LAYOUT` export'unu kullanır (yoksa undefined). Genel JSON nesnesi olarak taşınır; node/route şeması ART-MAP ve LV-UI sözleşmesidir. QA mevcutsa JSON sözdizimini kontrol eder. Global render ayarı ve mevcut sahneler değiştirilmedi.
