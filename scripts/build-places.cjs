// scripts/build-places.cjs
const fs = require('fs');
const path = require('path');

// Gist'ten çektiğin il.json ve ilce.json formatına göre çalışıyor
// İl:  { plaka, il_adi, lat, lon, ... }
// İlçe:{ ilce_id, il_plaka, ilce_adi, lat, lon, ... }

function main() {
    const root = process.cwd();

    const ilPath = path.join(root, 'data/raw/il.json');
    const ilcePath = path.join(root, 'data/raw/ilce.json');

    if (!fs.existsSync(ilPath) || !fs.existsSync(ilcePath)) {
        console.error('❌ data/raw/il.json veya ilce.json bulunamadı.');
        process.exit(1);
    }

    const ilData = JSON.parse(fs.readFileSync(ilPath, 'utf-8'));
    const ilceData = JSON.parse(fs.readFileSync(ilcePath, 'utf-8'));

    const ilMap = new Map();
    ilData.forEach((il) => {
        ilMap.set(il.plaka, il);
    });

    const places = ilceData.map((ilce) => {
        const il = ilMap.get(ilce.il_plaka);

        const city = normalize((il && il.il_adi) || '');
        const district = normalize(ilce.ilce_adi || '');

        return {
            id: `ilce-${ilce.ilce_id}`,
            cityCode: ilce.il_plaka,
            cityName: city,
            districtName: district,
            label: `${city} / ${district}`,
            lat: ilce.lat,
            lng: ilce.lon,
        };
    });

    const outPath = path.join(root, 'src/data/places-tr.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(places, null, 2), 'utf-8');

    console.log(`✔ ${places.length} ilçe kaydedildi → src/data/places-tr.json`);
}

function normalize(s) {
    return s
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

main();