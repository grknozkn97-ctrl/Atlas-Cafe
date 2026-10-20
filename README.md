# Devlet: Ülke Yönetim Simülasyonu

Tarayıcıda oynanan, gerçek zamanlı ve çok oyunculu bir ülke yönetim simülasyonu. Sunucuda dünya sürekli
işler: oyuncular gerçek ülkelerden birini seçip yönetir, seçilmeyen ülkeleri yapay zekâ yönetir.

**Zaman:** 1 gerçek gün ≈ 2 oyun ayı (1 oyun günü = 24 gerçek dakika). Türkiye'nin 5 yıllık seçim dönemi
yaklaşık 30 gerçek güne denk gelir.

## Neler var (ilk sürüm)

- 23 ülke, 2025 civarı yaklaşık gerçek verilerle (otoriter rejimler şimdilik sadece yapay zekâda)
- Ekonomi: vergiler, politika faizi, merkez bankası bağımsızlığı, asgari ücret
- Neden-sonuç modeli: enflasyon, büyüme, işsizlik ve hükümete destek, etkenlerin gecikmeli toplamıdır;
  "Neden?" paneli her etkenin payını gösterir
- 10 bakanlığın bütçesi ve hizmet kalitesi
- Yatırımlar: fabrika, enerji santrali, otoyol, hastane, okul, savunma sanayii, dijital devlet
- Kabine: bakan atama ve görevden alma, aday havuzu, çeyreklik karne
- Toplum grupları, seçimler, kampanya (miting, seçim ekonomisi). Seçimi kaybeden ülkesini kaybeder
- Savunma: askeri güç, rakip ülkeler ve dış tehdit
- Rastgele olaylar (deprem, salgın, kriz, grev, skandal…) ve karar süresi dolunca otomatik pilot

Tasarım ayrıntıları: [docs/tasarim-belgesi.md](docs/tasarim-belgesi.md)

## Çalıştırma

Node.js 20 veya üstü gerekir.

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173 (1 oyun günü = 3 saniye)
```

Üretim:

```bash
npm run build
npm start          # http://localhost:3001
```

Ortam değişkenleri:

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | `3001` | Sunucu portu |
| `GAME_DAY_MS` | `1440000` | Bir oyun gününün gerçek süresi (ms) |
| `DATA_FILE` | `data/world.json` | Dünya kaydının yolu |
| `SEED` | zamana göre | Rastgelelik tohumu |

## Tek oyunculu deneme sürümü

`npm run build:demo` sunucusuz bir sürüm üretir: simülasyon tarayıcıda çalışır, oyun hızı üst çubuktan
ayarlanır ve ilerleme tarayıcıda saklanır.

## Diğer komutlar

```bash
npm test           # simülasyon testleri
npm run typecheck
npm run simulate -- 10   # oyuncusuz dünyayı 10 yıl ilerletip göstergeleri yazdırır
```

## Yapı

```
src/shared   simülasyon, veri, tipler (sunucu ve istemci ortak kullanır)
src/server   HTTP + WebSocket sunucusu, oyun döngüsü, kayıt
src/client   React arayüzü
```

Sunucu yetkilidir: istemci sadece karar gönderir, sunucu doğrular ve her oyun gününde dünyayı ilerletip
güncel durumu WebSocket ile yayınlar.
