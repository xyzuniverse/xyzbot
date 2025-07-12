const axios = require('axios');
const cron = require('node-cron');
const { createCanvas, loadImage, registerFont  } = require('canvas');
const path = require('path'); 
const scheduledJobs = {};

// --- FUNGSI API ---
async function getCityId(cityName) {
    try {
        const response = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(cityName)}`);
        const data = response.data;
        if (!data.status || !data.data || data.data.length === 0) return null;
        return data.data[0].id;
    } catch (error) {
        throw new Error("Gagal terhubung ke API pencarian kota.");
    }
}

async function getPrayerTimes(cityId, date = new Date()) {
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const response = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
        if (!response.data.status || !response.data.data) return null;
        return response.data.data;
    } catch (error) {
        throw new Error("Gagal mengambil data jadwal sholat.");
    }
}

const fontPath = path.join(__dirname, '../../lib/fonts/UthmanicHafs.ttf');
try {
    registerFont(fontPath, { family: 'QuranFont' });
    console.log('[FONT] Font Quran kustom berhasil didaftarkan.');
} catch (e) {
    console.error(`[FONT] Gagal mendaftarkan font dari ${fontPath}:`, e);
}

// Fungsi untuk membuat gambar jadwal sholat
async function createScheduleImage(prayerData) {
    const width = 900;
    const height = 1400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Gradient background yang menarik
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f4c75');
    gradient.addColorStop(0.3, '#3282b8');
    gradient.addColorStop(0.7, '#0f4c75');
    gradient.addColorStop(1, '#0a2a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Tambahkan pattern dekoratif 
    ctx.globalAlpha = 0.08; 
    for (let i = 0; i < 25; i++) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2; 
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 40 + 15, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Fungsi untuk menggambar gambar masjid
    const drawMosqueIcon = (x, y, size) => {
        ctx.save();
        
        // Shadow untuk icon
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Bintang di langit
        ctx.fillStyle = '#fff59d';
        ctx.shadowColor = 'rgba(255, 245, 157, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x - size * 0.9, y - size * 0.7, size * 0.12, 0, 2 * Math.PI); // Diperbesar dari 0.08 ke 0.12
        ctx.fill();
        
        // Bulan sabit kecil
        ctx.fillStyle = '#ffed4a';
        ctx.shadowColor = 'rgba(255, 237, 74, 0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x + size * 0.9, y - size * 0.6, size * 0.1, 0.3 * Math.PI, 1.7 * Math.PI); // Diperbesar dari 0.06 ke 0.1
        ctx.fill();
        
        // Reset shadow untuk elemen lain
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        
        // Menara kiri
        const leftTowerGradient = ctx.createLinearGradient(x - size * 0.8, y - size * 0.5, x - size * 0.6, y - size * 0.5);
        leftTowerGradient.addColorStop(0, '#e6ac00');
        leftTowerGradient.addColorStop(0.5, '#ffd700');
        leftTowerGradient.addColorStop(1, '#fff59d');
        ctx.fillStyle = leftTowerGradient;
        ctx.fillRect(x - size * 0.85, y - size * 0.5, size * 0.25, size * 1.1);
        
        // Border menara kiri
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.85, y - size * 0.5, size * 0.25, size * 1.1);
        
        // Detail jendela menara kiri
        ctx.fillStyle = '#2c3e50';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x - size * 0.78, y - size * 0.3 + i * size * 0.25, size * 0.11, size * 0.08);
        }
        
        // Kubah menara kiri
        const leftDomeGradient = ctx.createRadialGradient(x - size * 0.725, y - size * 0.5, 0, x - size * 0.725, y - size * 0.5, size * 0.15);
        leftDomeGradient.addColorStop(0, '#fff59d');
        leftDomeGradient.addColorStop(0.7, '#ffd700');
        leftDomeGradient.addColorStop(1, '#e6ac00');
        ctx.fillStyle = leftDomeGradient;
        ctx.beginPath();
        ctx.arc(x - size * 0.725, y - size * 0.5, size * 0.125, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
        
        // Puncak menara kiri
        ctx.fillStyle = '#ffed4a';
        ctx.beginPath();
        ctx.arc(x - size * 0.725, y - size * 0.62, size * 0.05, 0, 2 * Math.PI);
        ctx.fill();
        
        // Menara kanan
        const rightTowerGradient = ctx.createLinearGradient(x + size * 0.6, y - size * 0.5, x + size * 0.85, y - size * 0.5);
        rightTowerGradient.addColorStop(0, '#fff59d');
        rightTowerGradient.addColorStop(0.5, '#ffd700');
        rightTowerGradient.addColorStop(1, '#e6ac00');
        ctx.fillStyle = rightTowerGradient;
        ctx.fillRect(x + size * 0.6, y - size * 0.5, size * 0.25, size * 1.1);
        
        // Border menara kanan
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + size * 0.6, y - size * 0.5, size * 0.25, size * 1.1);
        
        // Detail jendela menara kanan
        ctx.fillStyle = '#2c3e50';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + size * 0.67, y - size * 0.3 + i * size * 0.25, size * 0.11, size * 0.08);
        }
        
        // Kubah menara kanan
        const rightDomeGradient = ctx.createRadialGradient(x + size * 0.725, y - size * 0.5, 0, x + size * 0.725, y - size * 0.5, size * 0.15);
        rightDomeGradient.addColorStop(0, '#fff59d');
        rightDomeGradient.addColorStop(0.7, '#ffd700');
        rightDomeGradient.addColorStop(1, '#e6ac00');
        ctx.fillStyle = rightDomeGradient;
        ctx.beginPath();
        ctx.arc(x + size * 0.725, y - size * 0.5, size * 0.125, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
        
        // Puncak menara kanan
        ctx.fillStyle = '#ffed4a';
        ctx.beginPath();
        ctx.arc(x + size * 0.725, y - size * 0.62, size * 0.05, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bangunan utama
        const mainBuildingGradient = ctx.createLinearGradient(x - size * 0.6, y - size * 0.2, x + size * 0.6, y + size * 0.8);
        mainBuildingGradient.addColorStop(0, '#fff59d');
        mainBuildingGradient.addColorStop(0.3, '#ffd700');
        mainBuildingGradient.addColorStop(0.7, '#e6ac00');
        mainBuildingGradient.addColorStop(1, '#b8860b');
        ctx.fillStyle = mainBuildingGradient;
        ctx.fillRect(x - size * 0.6, y - size * 0.2, size * 1.2, size * 0.8);
        
        // Border bangunan utama
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - size * 0.6, y - size * 0.2, size * 1.2, size * 0.8);
        
        // Kubah utama
        const mainDomeGradient = ctx.createRadialGradient(x, y - size * 0.2, 0, x, y - size * 0.2, size * 0.5);
        mainDomeGradient.addColorStop(0, '#fff59d');
        mainDomeGradient.addColorStop(0.5, '#ffd700');
        mainDomeGradient.addColorStop(1, '#e6ac00');
        ctx.fillStyle = mainDomeGradient;
        ctx.beginPath();
        ctx.arc(x, y - size * 0.2, size * 0.5, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
        
        // Puncak kubah utama dengan ornamen
        ctx.fillStyle = '#ffed4a';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.7, size * 0.08, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bintang 8 sudut di puncak kubah
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        const starPoints = 8;
        const outerRadius = size * 0.08;
        const innerRadius = size * 0.04;
        
        for (let i = 0; i < starPoints * 2; i++) {
            const angle = (i * Math.PI) / starPoints;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const starX = x + Math.cos(angle) * radius;
            const starY = y - size * 0.7 + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(starX, starY);
            } else {
                ctx.lineTo(starX, starY);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Pintu utama
        const doorGradient = ctx.createLinearGradient(x - size * 0.15, y + size * 0.1, x + size * 0.15, y + size * 0.6);
        doorGradient.addColorStop(0, '#34495e');
        doorGradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = doorGradient;
        ctx.fillRect(x - size * 0.15, y + size * 0.1, size * 0.3, size * 0.5);
        
        // Lengkungan pintu
        ctx.beginPath();
        ctx.arc(x, y + size * 0.1, size * 0.15, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
        
        // Ornamen pada pintu
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y + size * 0.35, size * 0.04, 0, 2 * Math.PI);
        ctx.fill();
        
        // Jendela kiri dengan detail
        ctx.fillStyle = '#34495e';
        ctx.fillRect(x - size * 0.45, y + size * 0.15, size * 0.15, size * 0.2);
        ctx.strokeRect(x - size * 0.45, y + size * 0.15, size * 0.15, size * 0.2);
        
        // Lengkungan jendela kiri
        ctx.beginPath();
        ctx.arc(x - size * 0.375, y + size * 0.15, size * 0.075, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
        
        // Jendela kanan dengan detail
        ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.15, size * 0.2);
        ctx.strokeRect(x + size * 0.3, y + size * 0.15, size * 0.15, size * 0.2);
        
        // Lengkungan jendela kanan
        ctx.beginPath();
        ctx.arc(x + size * 0.375, y + size * 0.15, size * 0.075, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
        
        // Ornamen geometris di bangunan
        ctx.fillStyle = '#ffed4a';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x - size * 0.3 + i * size * 0.3, y + size * 0.05, size * 0.025, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Kaligrafi sederhana di atas pintu
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 2;
        ctx.font = `bold ${size * 0.12}px Arial`; 
        ctx.textAlign = 'center';
        ctx.fillText('الله', x, y - size * 0.05);
        
        ctx.restore();
    };

    // Header dengan Bismillah
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Bismillah di header
    ctx.fillStyle = '#ffd700';
    ctx.font = '32px QuranFont';
    ctx.textAlign = 'center';
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', width / 2, 50);
    
    // Judul dengan font yang lebih elegant
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JADWAL SHOLAT', width / 2, 110);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Gambar icon masjid di kedua sisi dengan posisi yang sejajar dengan header
    drawMosqueIcon(150, 130, 50);
    drawMosqueIcon(width - 150, 130, 50);

    // Informasi lokasi dan tanggal dengan background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(50, 180, width - 100, 100, 15);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Arial';
    ctx.fillText(prayerData.lokasi, width / 2, 220); 
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(prayerData.jadwal.tanggal, width / 2, 260);

    // Daftar Waktu Sholat dengan card design
    const schedule = [
        { name: 'Imsak', time: prayerData.jadwal.imsak, color: '#962121' },
        { name: 'Subuh', time: prayerData.jadwal.subuh, color: '#4ecdc4' },
        { name: 'Terbit', time: prayerData.jadwal.terbit, color: '#45b7d1' },
        { name: 'Dhuha', time: prayerData.jadwal.dhuha, color: '#f7ca18' },
        { name: 'Dzuhur', time: prayerData.jadwal.dzuhur, color: '#3a2d9c' },
        { name: 'Ashar', time: prayerData.jadwal.ashar, color: '#a29bfe' },
        { name: 'Maghrib', time: prayerData.jadwal.maghrib, color: '#fd79a8' },
        { name: 'Isya', time: prayerData.jadwal.isya, color: '#00b894' }
    ];

    let yPosition = 340;
    const cardHeight = 85;
    const cardMargin = 15;

    // Tambahkan method roundRect jika belum ada
    if (!ctx.roundRect) {
        ctx.roundRect = function(x, y, width, height, radius) {
            this.beginPath();
            this.moveTo(x + radius, y);
            this.lineTo(x + width - radius, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.lineTo(x + width, y + height - radius);
            this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.lineTo(x + radius, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.lineTo(x, y + radius);
            this.quadraticCurveTo(x, y, x + radius, y);
            this.closePath();
        };
    }

    schedule.forEach((item, index) => {
        const cardX = 70;
        const cardY = yPosition - 30;
        const cardWidth = width - 140;
        
        // Card background dengan gradient
        const cardGradient = ctx.createLinearGradient(0, cardY, 0, cardY + cardHeight);
        cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        
        ctx.fillStyle = cardGradient;
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
        ctx.fill();

        // Border kiri dengan warna
        ctx.fillStyle = item.color;
        ctx.fillRect(cardX, cardY, 6, cardHeight);

        // Hitung posisi vertikal untuk teks agar berada di tengah card
        const textCenterY = cardY + (cardHeight / 2) + 6;

        // Nama sholat - posisi di kiri dengan margin dari border
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, cardX + 25, textCenterY);

        // Waktu sholat - posisi di kanan dengan margin dari tepi
        ctx.fillStyle = item.color;
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.time, cardX + cardWidth - 25, textCenterY);

        yPosition += cardHeight + cardMargin;
    });

    // Reset text baseline ke default
    ctx.textBaseline = 'alphabetic';

    // Hitung posisi footer yang proporsional
    const footerStartY = yPosition + -7; 
    const footerHeight = 255;

    // Footer dengan ayat Al-Quran
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(50, footerStartY, width - 100, footerHeight, 15);
    ctx.fill();

    // Border footer yang lebih cantik
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.roundRect(50, footerStartY, width - 100, footerHeight, 15);
    ctx.stroke();

    // Ayat Al-Quran dalam bahasa Arab
    ctx.fillStyle = '#ffd700';
    ctx.font = '32px QuranFont';
    ctx.textAlign = 'center';
    
    // Baris pertama ayat
    ctx.fillText('اُتْلُ مَآ اُوْحِيَ اِلَيْكَ مِنَ الْكِتٰبِ وَاَقِمِ الصَّلٰوةَۗ', width / 2, footerStartY + 40);
    
    // Baris kedua ayat
    ctx.fillText('اِنَّ الصَّلٰوةَ تَنْهٰى عَنِ الْفَحْشَاۤءِ وَالْمُنْكَرِ', width / 2, footerStartY + 80);
    
    // Baris ketiga ayat
    ctx.fillText('وَلَذِكْرُ اللّٰهِ اَكْبَرُ ۗوَاللّٰهُ يَعْلَمُ مَا تَصْنَعُوْنَ', width / 2, footerStartY + 118);
    
    // Garis pemisah
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, footerStartY + 130);
    ctx.lineTo(width - 100, footerStartY + 130);
    ctx.stroke();
    
    // Terjemahan dalam bahasa Indonesia dengan spacing yang lebih compact
    ctx.font = '17px Arial';
    ctx.fillStyle = '#e0e0e0';
    
    // Baris pertama terjemahan
    ctx.fillText('"Bacalah Kitab (Al-Qur\'an) yang telah diwahyukan kepadamu', width / 2, footerStartY + 155);
    
    // Baris kedua terjemahan
    ctx.fillText('dan laksanakanlah sholat. Sesungguhnya sholat itu mencegah dari', width / 2, footerStartY + 175);
    
    // Baris ketiga terjemahan
    ctx.fillText('(perbuatan) keji dan mungkar, dan mengingat Allah itu lebih besar', width / 2, footerStartY + 195);
    
    // Baris keempat terjemahan
    ctx.fillText('(keutamaannya), dan Allah mengetahui apa yang kamu kerjakan."', width / 2, footerStartY + 215);
    
    // Sumber ayat
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('(QS. Al-Ankabut: 45)', width / 2, footerStartY + 240);

    try {
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error creating PNG buffer:', error);
        // Fallback: create simpler image
        return createSimpleScheduleImage(prayerData);
    }
}

// Fungsi fallback untuk gambar sederhana
function createSimpleScheduleImage(prayerData) {
    const width = 800;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background sederhana
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, width, height);

    // Judul
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JADWAL SHOLAT', width / 2, 100);

    // Lokasi dan tanggal
    ctx.font = '32px Arial';
    ctx.fillText(prayerData.lokasi, width / 2, 160);
    ctx.font = '24px Arial';
    ctx.fillText(prayerData.jadwal.tanggal, width / 2, 200);

    // Daftar sholat
    const schedule = [
        { name: 'Imsak', time: prayerData.jadwal.imsak },
        { name: 'Subuh', time: prayerData.jadwal.subuh },
        { name: 'Terbit', time: prayerData.jadwal.terbit },
        { name: 'Dhuha', time: prayerData.jadwal.dhuha },
        { name: 'Dzuhur', time: prayerData.jadwal.dzuhur },
        { name: 'Ashar', time: prayerData.jadwal.ashar },
        { name: 'Maghrib', time: prayerData.jadwal.maghrib },
        { name: 'Isya', time: prayerData.jadwal.isya }
    ];

    let yPosition = 280;
    ctx.font = '32px Arial';
    schedule.forEach(item => {
        ctx.textAlign = 'left';
        ctx.fillText(item.name, 100, yPosition);
        ctx.textAlign = 'right';
        ctx.fillText(item.time, width - 100, yPosition);
        yPosition += 60;
    });

    return canvas.toBuffer('image/png');
}

// --- FUNGSI PENJADWALAN NOTIFIKASI ---
function schedulePrayerNotifications(bot, groupId, prayerData, cityId) {
    const schedule = prayerData.jadwal;
    const prayerOrder = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

    if (scheduledJobs[groupId]) {
        scheduledJobs[groupId].forEach(job => job.stop());
    }
    scheduledJobs[groupId] = [];

    prayerOrder.forEach((prayerName, index) => {
        const time = schedule[prayerName];
        if (!time) return;
        const [hour, minute] = time.split(':');
        
        const job = cron.schedule(`${minute} ${hour} * * *`, async () => {
            let nextPrayerName = '';
            let nextPrayerTime = '';

            if (index < prayerOrder.length - 1) {
                nextPrayerName = prayerOrder[index + 1];
                nextPrayerTime = schedule[nextPrayerName];
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowPrayerData = await getPrayerTimes(cityId, tomorrow);
                if (tomorrowPrayerData) {
                    nextPrayerName = 'subuh';
                    nextPrayerTime = tomorrowPrayerData.jadwal.subuh;
                }
            }
            
            let notificationMessage = `🕌 Waktunya Sholat *${prayerName.toUpperCase()}* untuk wilayah *${prayerData.lokasi}* dan sekitarnya.\n\nSegeralah ambil air wudhu dan melaksanakan shalat😇.`;
            if (nextPrayerName && nextPrayerTime) {
                notificationMessage += `\n\nSholat selanjutnya: *${nextPrayerName.toUpperCase()}* pukul *${nextPrayerTime}*`;
            }

            bot.sendMessage(groupId, { text: notificationMessage });
        }, {
            scheduled: true,
            timezone: "Asia/Jakarta"
        });
        
        scheduledJobs[groupId].push(job);
    });

    console.log(`Jadwal notifikasi sholat untuk grup ${groupId} (${prayerData.lokasi}) telah berhasil diatur.`);
}

// --- EKSPOR MODUL ---
module.exports = {
  name: "sholat",
  alias: ["jadwalsholat"],
  description: "Mengatur dan menampilkan jadwal sholat.",
  execute: async (msg, { bot, args, usedPrefix }) => {
    const subCommand = args[0]?.toLowerCase();
    const groupConfig = bot.db.data.groups[msg.from];

    if (subCommand === "set") {
        const cityName = args.slice(1).join(" ");
        if (!cityName) return msg.reply(`Gunakan format: \`${usedPrefix}sholat set <nama kota>\``);
        
        try {
            await msg.react("⏳");
            const cityId = await getCityId(cityName);
            if (!cityId) return msg.reply(`⚠️ Kota "${cityName}" tidak ditemukan.`);
            
            const prayerTimes = await getPrayerTimes(cityId);
            if (!prayerTimes) return msg.reply("Gagal mendapatkan jadwal sholat untuk kota tersebut.");
            
            if (!bot.db.data.groups[msg.from]) bot.db.data.groups[msg.from] = {};
            bot.db.data.groups[msg.from].sholat_city_id = cityId;
            bot.db.data.groups[msg.from].sholat_city_name = prayerTimes.lokasi;
            await bot.db.write();

            schedulePrayerNotifications(bot, msg.from, prayerTimes, cityId);

            await msg.react("✅");
            return msg.reply(`✅ Lokasi sholat berhasil diatur ke *${prayerTimes.lokasi}*.`);

        } catch (e) {
            await msg.react("⚠️");
            return msg.reply(`⚠️ ${e.message}`);
        }
    }
    
    if (subCommand === "jadwal") {
        const targetCityName = args.slice(1).join(" ");
        let cityId;

        if (targetCityName) {
            try {
                await msg.react("⏳");
                const foundCityId = await getCityId(targetCityName);
                if (!foundCityId) return msg.reply(`⚠️ Kota "${targetCityName}" tidak ditemukan.`);
                cityId = foundCityId;
            } catch (e) { return msg.reply(`⚠️ ${e.message}`); }
        } else {
            if (!groupConfig?.sholat_city_id) return msg.reply(`⚠️ Lokasi belum diatur. Atur dengan: \`${usedPrefix}sholat set <kota>\`\nLihat jadwal: \`${usedPrefix}sholat jadwal <kota>\``);
            cityId = groupConfig.sholat_city_id;
        }

        try {
            if (!targetCityName) await msg.react("⏳");
            const prayerTimes = await getPrayerTimes(cityId);
            if (!prayerTimes) return msg.reply("Gagal mengambil jadwal sholat saat ini.");

            console.log("Membuat gambar jadwal sholat...");
            const imageBuffer = await createScheduleImage(prayerTimes);
            
            await bot.sendMessage(msg.from, { 
                image: imageBuffer, 
                caption: `✨ Jadwal sholat untuk wilayah *${prayerTimes.lokasi}* ✨\n\n_Semoga Allah memudahkan ibadah kita semua_ 🤲` 
            });
            await msg.react("✅");

        } catch (e) {
            console.error("Error dalam createScheduleImage:", e);
            await msg.react("⚠️");
            return msg.reply(`⚠️ Terjadi kesalahan saat membuat gambar: ${e.message}`);
        }
        return;
    }
    
    if (!subCommand) {
        if (!groupConfig?.sholat_city_id) {
            return msg.reply(`⚠️ Lokasi sholat belum diatur. Atur dengan perintah: \`${usedPrefix}sholat set <nama kota>\``);
        }
        try {
            await msg.react("⏳");
            const cityId = groupConfig.sholat_city_id;
            const prayerTimes = await getPrayerTimes(cityId);
            if (!prayerTimes) return msg.reply("Gagal mengambil info sholat selanjutnya.");
            
            const now = new Date();
            const currentTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
            const currentTimeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
            
            const prayerOrder = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
            let nextPrayerName = 'Subuh (besok)';
            let nextPrayerTime = 'N/A';

            for (const prayer of prayerOrder) {
                if (currentTimeStr < prayerTimes.jadwal[prayer]) {
                    nextPrayerName = prayer.charAt(0).toUpperCase() + prayer.slice(1);
                    nextPrayerTime = prayerTimes.jadwal[prayer];
                    break;
                }
            }

            if (nextPrayerTime === 'N/A') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowPrayerData = await getPrayerTimes(cityId, tomorrow);
                if (tomorrowPrayerData) {
                    nextPrayerTime = tomorrowPrayerData.jadwal.subuh;
                }
            }

            let responseMessage = `ℹ️ *Informasi Sholat*\n\n`;
            responseMessage += `📍 Lokasi diatur ke: *${groupConfig.sholat_city_name}*\n`;
            responseMessage += `🕌 Sholat selanjutnya: *${nextPrayerName}* pukul *${nextPrayerTime}*\n\n`;
            responseMessage += `Gunakan \`.sholat jadwal\` untuk melihat jadwal lengkap hari ini.`;

            await msg.react("✅");
            return msg.reply(responseMessage);

        } catch(e) {
            await msg.react("⚠️");
            return msg.reply(`⚠️ ${e.message}`);
        }
    }

    return msg.reply(`Perintah tidak dikenali. Gunakan \`.sholat set\`, \`.sholat jadwal\`, atau \`.sholat\`.`);
  },
  internalFunctions: { getPrayerTimes, schedulePrayerNotifications }
};
