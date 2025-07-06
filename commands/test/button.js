module.exports = {
  cmd: ["tombol"],
  tags: "tools",
  help: ["tombol"],
  desc: "Contoh tombol interaktif",

  async handler(m, { conn }) {
    await conn.sendMessage(m.chat, {
      text: "Halo! Ini adalah contoh tombol sederhana.\nPilih salah satu opsi di bawah ini:",
      footer: "Contoh Bot @neoxr/baileys",
      buttons: [
        {
          buttonId: `.menu`,
          buttonText: { displayText: "📜 Menu" },
          type: 1
        },
        {
          buttonId: `.donasi`,
          buttonText: { displayText: "💰 Donasi" },
          type: 1
        },
        {
          buttonId: `.owner`,
          buttonText: { displayText: "👤 Owner" },
          type: 1
        }
      ],
      headerType: 1
    }, { quoted: m });
  }
};
