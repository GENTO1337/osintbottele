const { Telegraf, session, Markup } = require('telegraf')
const { message } = require('telegraf/filters')
const { Kpu } = require('./Scrape/kpu.js')
const { Saweria } = require('./Scrape/saweria.js')
const { SkriningBPJS } = require('./Scrape/skriningbpjs.js')
const { autoFetchDetails } = require('./Scrape/siswa.js')
const { Run } = require('./Scrape/edabu.js')
const { parsenik } = require('./Scrape/parsenik.js')
const { cekNik } = require('./Scrape/bpjs.js')
const { cekSwab } = require('./Scrape/swab.js')
const axios = require('axios')
const schedule = require('node-schedule')
const fs = require('fs')
const FormData = require('form-data')
const { fromBuffer } = require("file-type")
const { error } = require('console')
const gtwy = new Saweria('c3b34c02-c9b6-4990-b806-4e25dbdb34e6')
const c = new SkriningBPJS()
const dbPath = './database.json'
schedule.scheduleJob('0 0 * * *', () => {
  resetLimitAndNotifyUsers()
})
require('./config.js')

const token = 'Token'


const loadDatabase = () => 
    fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : {}

const saveDatabase = (data) => 
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))

let userPSN = {}
let userPSC = {}
let userPTN = {}
let userSDT = {}
let userSDTV = {}
let userTNKB = {}
let userIMEI = {}
let userGTC = {}
let userDB = {}
let userBPS = {}
let userDK = {}
let userDEPO = {}
let userDPT = {}
let userSearchCache = {}
let database = loadDatabase()
const searchResults = {}
const bot = new Telegraf(token)
bot.use(session())

bot.start(async (ctx) => {
  if (ctx.chat.type !== 'private') return

  const chatId = ctx.update.message.from.id
  const username = ctx.chat.username || 'tidak ada'
  const usernameBersih = username.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '')
  const nama = ctx.chat.first_name || 'Pengguna'

  if (!database[chatId]) {
    database[chatId] = { limit: 3, status: 'Gratisan' }
    saveDatabase(database)
  }

  try {
    const anggota = await ctx.telegram.getChatMember('@ePhoneTools', chatId)

    if (['member', 'administrator', 'creator'].includes(anggota.status)) {
      if (!database[chatId].phone) {
        return ctx.reply(
          'Karena aturan baru, silakan kirim kontak Anda untuk melanjutkan akses layanan ini.',
          {
            reply_to_message_id: ctx.message.message_id,
            reply_markup: {
              keyboard: [[{ text: 'Kirim Kontak', request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        )
      }

      const pesan = `
\`\`\`
Hai ${nama}, Selamat Datang di ePhoneNIK Bot
------------------------
ID Pengguna : ${chatId}
Nama        : ${nama}
Username    : @${usernameBersih}
Status      : ${database[chatId].status}
------------------------
Layanan:
------------------------
BPJS Personal    : /bpjs_info (nik)
BPJS Skrining    : /bpjs_skrining (nik)
BPJS Keluarga    : /bpjs_family (nik)
Getcontact JS    : /getcontact (nomor)
Info Kendaraan   : /tnkb_check (nopol)
IP Lookup        : /ip_lookup (ip)
Kebocoran Data   : /leaks_db (input)
Cek NIK          : /cek_nik (nik)
Phone Lookup     : /phone_lookup (nomor)
Nomor ke NIK     : /phone_nik (nomor)
Registrasi SIM   : /phone_regist (nomor)
Pencarian Data   : /search_data (nama)
Cari Siswa       : /search_siswa (nama)
Cari Dosen       : /search_dosen (nama)
------------------------
\`\`\`
      `.trim()
      let teks = `Halo ${nama}, Selamat Datang di ePhoneNIK Bot\n\n`
      teks += `<b>Privasi dan Keamanan</b>\n`
      teks += `Kami tidak menyimpan data pencarian Anda. Semua hasil bersifat sementara dan hanya dapat diakses oleh pengguna yang melakukan pencarian.\n\n`
      teks += `<b>Cara Menggunakan</b>\n`
      teks += `1. Pilih menu yang tersedia di bawah.\n`
      teks += `2. Masukkan data yang diminta jika diperlukan.\n`
      teks += `3. Tunggu bot memproses dan menampilkan hasil.\n\n`
      teks += `<i>Dikembangkan oleh <a href="t.me/HeyyKemii">Kemii</a></i>`

      await ctx.reply(`${teks}`.trim(), {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_to_message_id: ctx.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'UP PREMIUM', url: 'https://t.me/HeyyKemii' },
              { text: 'TOPUP LIMIT', callback_data: 'use_limit' }
            ],
            [
              { text: 'DETAIL NO NIK', callback_data: 'use_cn' },
              { text: 'CEK NOPOL', callback_data: 'use_nopol' }
            ],
            [
              { text: 'PENCARIAN DATA', callback_data: 'use_sdt' },
              { text: 'PENCARIAN DATA V2', callback_data: 'use_sdtv2' }
            ],
            [
              { text: 'DATA KELUARGA', callback_data: 'use_dk' },
              { text: 'CEK SIM CARD', callback_data: 'use_cds' },
            ],
            [
              { text: 'CARI SISWA', callback_data: 'use_csw' },
              { text: 'CARI DOSEN', callback_data: 'use_cdb' }
            ],
            [
              { text: 'GETCONTACT', callback_data: 'use_gtc' },
              { text: 'DETAIL IP', callback_data: 'use_ipl' }
            ],
            [
              { text: 'DATABASE LEAKS', callback_data: 'use_sdb' },
              { text: 'PASIEN COVID', callback_data: 'use_psc' }
            ],
            [
              { text: 'CEK DPT ONLINE', callback_data: 'use_dpt' },
              { text: 'INFO BPJS', callback_data: 'use_bpjs' }
            ]
          ]
        }
      })
    } else {
      ctx.reply(
        'Anda harus bergabung dengan grup Bot terlebih dahulu.\n\nKlik tombol di bawah ini untuk bergabung:',
        {
          reply_to_message_id: ctx.message.message_id,
          reply_markup: {
            inline_keyboard: [[{ text: 'Gabung Sekarang', url: 'https://t.me/ePhoneTools' }]],
          },
        }
      )
    }
  } catch (error) {
    ctx.reply('Terjadi kesalahan saat memeriksa status keanggotaan Anda.', {
      reply_to_message_id: ctx.message.message_id,
    })
  }
})

bot.command('broadcast', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (!global.owner.includes(chatId)) return ctx.reply('No have access', {
    reply_to_message_id: ctx.message.message_id
  })

  const message = ctx.message.text.split(' ').slice(1).join(' ')
  if (!message) return ctx.reply('Gunakan: /broadcast [pesan]', {
    reply_to_message_id: ctx.message.message_id
  })

  let sentCount = 0
  let blockedCount = 0

  for (const userID in database) {
      try {
          await bot.telegram.sendMessage(userID, message)
          sentCount++
      } catch (error) {
          if (error.response?.error_code === 403) {
              delete database[userID]
              blockedCount++
          }
      }
  }

  saveDatabase(database)

  ctx.reply(`Pesan dikirim ke ${sentCount} pengguna\n${blockedCount} pengguna telah blokir bot dan dihapus`)
})

bot.command('addlimit', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (!global.owner.includes(chatId)) return ctx.reply('No have access', {
    reply_to_message_id: ctx.message.message_id
  })

  const message = ctx.update.message.text
  const args = message.split(' ')

  if (!args[1] || !args[2]) {
    return ctx.reply('📝 Masukan ID dan Jumlah limit\nContoh: /addlimit 123456 1000', {
      reply_to_message_id: ctx.message.message_id
    })
  }

  try {
    const userId = args[1]
    const additionalLimit = Number(args[2])

    if (isNaN(additionalLimit) || additionalLimit <= 0) {
      return ctx.reply('Masukkan angka limit yang valid.', {
        reply_to_message_id: ctx.message.message_id
      })
    }

    if (database[userId]) {
      let currentLimit = Number(database[userId].limit) || 0
      database[userId].limit = currentLimit + additionalLimit
      saveDatabase(database)
      await ctx.reply(`Limit untuk ID ${userId} berhasil ditambahkan. Limit baru: ${database[userId].limit}`, {
        reply_to_message_id: ctx.message.message_id
      })
    } else {
      await ctx.reply('Sepertinya id tersebut tidak ada di dalam database', {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } catch (error) {
    console.error(error)
    await ctx.reply('Terjadi kesalahan saat menambahkan limit', {
      reply_to_message_id: ctx.message.message_id
    })
  }
})

bot.command('addprem', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (!global.owner.includes(chatId)) return
  const args = ctx.message.text.split(' ')
  if (args.length < 2) return ctx.reply('Example: /addpremium 1234567')
  addPremium(ctx, args[1], args[2])
})

bot.command('delprem', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (!global.owner.includes(chatId)) return
  const args = ctx.message.text.split(' ')
  if (args.length === 2) {
    deletePremium(ctx, args[1])
  } else {
    deletePremium(ctx)
  }
})

bot.command('profile', async (ctx) => {
  const chatId = ctx.update.message.from.id
  console.log("chatId:", chatId)
  const name = ctx.update.message.from.first_name || 'Pengguna'

  let capt = `*📝 Nama:* ${name}\n`
  capt += `*🆔 ID:* ${chatId}\n`
  capt += `*📌 Status:* ${database[chatId].status}\n`
  capt += `*🔢 Limit:* ${database[chatId].limit}`
  await ctx.reply(capt.trim(), {
    parse_mode: 'Markdown',
    reply_to_message_id: ctx.message.message_id
  })
})

bot.command('batal', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (userDEPO[chatId]?.status) {
    await ctx.reply('Proses dibatalkan dan sesi dihapus.', {
      reply_to_message_id: ctx.message.message_id
    })
    delete userDEPO[chatId]
  } else {
    await ctx.reply('Tidak ada sesi yang aktif.', {
      reply_to_message_id: ctx.message.message_id
    })
  }
})

bot.command('donatur', async (ctx) => {
  const chatId = ctx.update.message.from.id
  const login = await gtwy.login('kemiidenpai@gmail.com', '@Kemii321456')
  const donaturPage1 = await gtwy.getTransactions()
  const donaturPage2 = await gtwy.getTransactions(2)
  const donaturPage3 = await gtwy.getTransactions(3)
  const donaturPage4 = await gtwy.getTransactions(4)
  const donaturPage5 = await gtwy.getTransactions(5)
  const donaturPage6 = await gtwy.getTransactions(6)
  const donaturPage7 = await gtwy.getTransactions(7)
  const donaturPage8 = await gtwy.getTransactions(8)
  const donaturPage9 = await gtwy.getTransactions(9)
  const donaturPage10 = await gtwy.getTransactions(10)
  const allTransactions = donaturPage1.data.transactions.concat(donaturPage2.data.transactions).concat(donaturPage3.data.transactions).concat(donaturPage4.data.transactions).concat(donaturPage5.data.transactions).concat(donaturPage6.data.transactions).concat(donaturPage7.data.transactions).concat(donaturPage8.data.transactions).concat(donaturPage9.data.transactions).concat(donaturPage10.data.transactions)
  const totalDonasi = allTransactions.reduce((total, transaksi) => total + transaksi.amount, 0)
  const sortedTransactions = allTransactions.sort((a, b) => b.amount - a.amount)
  let mount = 1
  let capt = `Total donasi : Rp ${formatNominal(totalDonasi)}\n\n`
  for (let i of sortedTransactions) {
    capt += `*${mount++}*. ${i.donator_name} : Rp ${formatNominal(i.amount)}\n`
  }
  await ctx.reply(capt.trim(), {
    parse_mode: 'Markdown',
    reply_to_message_id: ctx.message.message_id
  })
})

bot.command('dxuser', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (database[chatId].status !== 'Developer') return
  await resetLimitAndNotifyUsers()
  await ctx.reply('Mereset limit UserDX', {
    reply_to_message_id: ctx.message.message_id
  })
})

bot.command('listuser', async (ctx) => {
  const user = Object.keys(database).map(data => {
    console.log(database[data])
  })
})

bot.command('setkey', async (ctx) => {
  const chatId = ctx.update.message.from.id
  const message = ctx.update.message.text
  const args = message.split(' ')
  if (!args[1]) return ctx.reply('📝 Silahkan apikey anda.\nContoh: /setkey apikey', {
    parse_mode: 'Markdown',
    reply_to_message_id: ctx.message.message_id
  })
  await ctx.reply('Sedang melalukan pengecekan quota APis.', {
    parse_mode: 'Markdown',
    reply_to_message_id: ctx.message.message_id
  })
  const data = await leaks('628816609112', args[1])
  if (data.Status === 'Error') {
    return ctx.reply('Maaf sepertinya quota api anda telah habis, silahkan mengambil ulang dengan akun telegram yang berbeda.', {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    })
  }
  await ctx.reply(`Apikey valid, quota api anda tersisa: ${data.free_requests_left}`, {
    parse_mode: 'Markdown',
    reply_to_message_id: ctx.message.message_id
  })
  database[chatId].key = args[1]
  saveDatabase(database)
})

bot.on('contact', async (ctx) => {
  const chatId = ctx.update.message.from.id
  const contact = ctx.message.contact
  
  database[chatId].phone = contact.phone_number
  database[chatId].name = contact.first_name
  saveDatabase(database)
  await ctx.reply('✅ Data berhasil tersimpan database.', {
    reply_to_message_id: ctx.message.message_id
  })
})

bot.command('search_siswa', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (!database[chatId] || database[chatId].limit < 1) {
    return ctx.reply('⚠️ Batas penggunaan akun gratis Anda telah habis.', {
      reply_to_message_id: ctx.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Premium', url: 'https://t.me/HeyyKemii' }],
          [{ text: '🔝 Topup Limit', callback_data: 'topup_limit' }]
        ]
      }
    })
  }

  const args = ctx.message.text.split(' ')
  const query = args.slice(1).join(" ")
  if (!query) {
    return ctx.reply('<b>Example:</b> /search_siswa (nama)', {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id
    })
  }

  try {
    const data = await autoFetchDetails(query)
    searchResults[chatId] = { data: data.results, page: 0 }
    studentResult(ctx, chatId, true)
    database[chatId].limit -= 1
    saveDatabase(database)
  } catch(error) {
    console.log(error)
    return ctx.reply('Tidak ada data / terjadi kesalahan.')
  }
})

bot.command('bpjs_skrining', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (database[chatId].status !== 'Premium') return ctx.reply('*This feature is for premium members only*', {
    parse_mode: 'MarkdownV2',
    reply_to_message_id: ctx.message.message_id,
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Premium', url: 'https://t.me/HeyyKemii'
        }]
      ]
    }
  })
  if (database[chatId].limit < 1) {
    return ctx.reply('⚠️ Batas penggunaan akun gratis Anda telah habis.', {
      reply_to_message_id: ctx.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💎 Premium', url: 'https://t.me/HeyyKemii' },
            { text: '🔝 Topup Limit', callback_data: 'topup_limit' }
          ]
        ]
      }
    })
  }

  const args = ctx.update.message.text.split(' ')
  if (!args[1]) {
    return ctx.reply('<b>Example:</b> /bpjs_skrining (nik)', {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id
    })
  }

  try {
    const nik = args[1]
    if (nik in c.cache) {
      await ctx.reply(`✅ Data ditemukan di cache: ${JSON.stringify(c.cache[nik])}`)
      return
    }

    const proses = await c.cek(nik)
    userBPS[chatId] = { status: 'waiting_captcha', proses, nik, id: ctx.message.message_id }
    /*
    fs.writeFileSync(`./captcha_${chatId}.jpg`, proses.captcha)
    */

    const result = await proses.send("DCODEKEMII")
    c.addCache(nik, result.response)

    let capt = `OUTPUT\n`
    capt += `Nama           : ${result.response.nama}\n`
    capt += `NIK            : ${result.response.nik}\n`
    capt += `No Kartu BPJS  : ${result.response.nokartu}\n`
    capt += `No KK          : ${result.response.nokk}\n`
    capt += `Jenis Kelamin  : ${result.response.sex === 'L' ? 'Laki-laki' : 'Perempuan'}\n`
    capt += `Tanggal Lahir  : ${result.response.tanggalLahir}\n`
    capt += `Status Kawin   : ${result.response.nmStKawin}\n`
    capt += `Status Peserta : ${result.response.nmStPst}\n`
    capt += `Jenis Peserta  : ${result.response.nmJnsPst}\n`
    capt += `Alamat         : ${result.response.alamat}\n`
    capt += `Faskes Umum    : ${result.response.nmppk}\n`
    capt += `Golongan Darah : ${result.response.golDarah === '0' ? 'Tidak Diketahui' : result.response.golDarah}\n`
    capt += `Kelas BPJS     : ${result.response.nmKelas}\n`
    capt += `Tgl Cetak Kartu: ${result.response.tglcetak}\n`
    capt += `Email          : ${result.response.email}\n`
    capt += `No Telepon     : ${result.response.noTelp}\n`
    
    await ctx.reply(`*Informasi Peserta:*\n\n\`\`\`${capt.trim()}\`\`\``, {
      parse_mode: 'MarkdownV2',
      reply_to_message_id: userBPS[chatId].id,
      reply_markup: {
        inline_keyboard: [[{ text: 'Premium', url: 'https://t.me/HeyyKemii' }]]
      }
    })

    database[chatId].limit -= 1
    saveDatabase(database)
    /*
    fs.unlinkSync(`./captcha_${chatId}.jpg`)
    */
    delete userBPS[chatId]
  } catch (error) {
    console.error(error)
    return ctx.reply(error, {
      reply_to_message_id: ctx.message.message_id
    })
  }
})

bot.command('getcontact', async (ctx) => {
  const chatId = ctx.update.message.from.id
  if (database[chatId].limit < 1) {
    return ctx.reply('⚠️ Batas penggunaan akun gratis Anda telah habis.', {
      reply_to_message_id: ctx.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💎 Premium', url: 'https://t.me/HeyyKemii' },
            { text: '🔝 Topup Limit', callback_data: 'topup_limit' }
          ]
        ]
      }
    })
  }
  const message = ctx.update.message.text
  const args = message.split(' ')
  if (!args[1]) return ctx.reply('<b>Example:</b> /getcontact (nomer)', {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id
  })
  await ctx.reply(`*🔍 Memulai Pengecekan GTC.JS:*\n${args[1]}`, {
    parse_mode: 'Markdown',
    reply_to_message_id: ctx.message.message_id
  })
})

bot.on(message('text'), async (ctx) => {
  const chatId = ctx.update.message.from.id
  const input = ctx.message.text

  if (userPTN[chatId]?.status) {
    try {
      const request = await axios.get(`http://47.245.93.152/request/leaks.php?request=${input}`)
      const results = request.data.List["KomInfo Indonesia"].Data
      if (!results || results.length === 0) {
        return ctx.reply('Data tidak ditemukan.')
      }
      const detailedResults = []
      for (const result of results) {
        const ceknikResponse = await axios.get(`http://47.245.93.152/request/parsenik.php?nik=${result.Passport}`)
        detailedResults.push({
          ...result,
          ceknikData: ceknikResponse.data
        })
      }
      userPTN[chatId] = { index: 0, results: detailedResults }
      const createMessage = (index) => {
        const result = detailedResults[index]
        let capt = `OUTPUT\n`
        capt += `NIK              : ${result.ceknikData.nik}\n`
        capt += `NAMA             : ${result.ceknikData.nama}\n`
        capt += `JENIS KELAMIN    : ${result.ceknikData.jenis_kelamin}\n`
        capt += `PEKERJAAN        : ${result.ceknikData.jenisPeserta}\n`
        capt += `TGL LAHIR        : ${result.ceknikData.tanggal_lahir}\n`
        capt += `PROVINSI         : ${result.ceknikData.provinsi}\n`
        capt += `Kabupaten/Kota   : ${result.ceknikData.kabupaten_kota}\n`
        capt += `KECAMATAN        : ${result.ceknikData.kecamatan}\n\n`
        capt += `Result ${index + 1} dari ${detailedResults.length}`
        return capt
      }
      const currentIndex = userPTN[chatId].index
      if (detailedResults.length === 1) {
        database[chatId].limit -= 1
        saveDatabase(database)
        
        return ctx.reply(`\`\`\`${createMessage(currentIndex)}\`\`\``, {
          parse_mode: 'MarkdownV2',
          reply_to_message_id: ctx.message.message_id,
        })
      }
      await ctx.reply(`\`\`\`${createMessage(currentIndex)}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Back', callback_data: 'prev' },
              { text: 'Next', callback_data: 'next' }
            ]
          ]
        }
      })
  
      database[chatId].limit -= 1
      saveDatabase(database)
    } catch(error) {
      console.log(error)
      await ctx.reply('Tidak ada data atau terjadi kesalahan.')
      delete userPTN[chatId]
    }
  } else if (userPSN[chatId]?.status) {
    try {
      const { data } = await axios.get(`http://47.245.93.152/request/ktp.php?nik=${input}`)
      const item = data[0]
      let capt = `OUTPUT\n`
      capt += `NIK           : ${item.NIK}\n`
      capt += `NAMA LENGKAP  : ${item.NAMA_LGKP}\n`
      capt += `KABUPATEN     : ${item.KAB_NAME}\n`
      capt += `PROVINSI      : ${item.PROP_NAME}\n`
      capt += `KECAMATAN     : ${item.KEC_NAME}\n`
      capt += `AGAMA         : ${item.AGAMA}\n`
      capt += `PEKERJAAN     : ${item.JENIS_PKRJN}\n`
      capt += `JENIS KELAMIN : ${item.JENIS_KLMIN}\n`
      capt += `STATUS KAWIN  : ${item.STATUS_KAWIN}\n`
      capt += `TGL LAHIR     : ${item.TGL_LHR}\n`
      capt += `TEMPAT LAHIR  : ${item.TMPT_LHR}\n`
      capt += `KELURAHAN     : ${item.KEL_NAME}\n`
      capt += `NO RT         : ${item.NO_RT}\n`
      capt += `NO RW         : ${item.NO_RW}\n`
      capt += `ALAMAT        : ${item.ALAMAT}`
      await ctx.reply(`\`\`\`${capt}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      delete userPSN[chatId]
    } catch(error) {
      await ctx.reply('Tidak ada data / terjadi kesalahan.')
    }
  } else if (userBPS[chatId]?.status) {
    try {
      const response = await axios.get(`http://47.245.93.152/request/bpjs.php?input=${input}`)
      const data = response.data.data
      let capt = `OUTPUT\n`
      capt += `NIK           : ${data.nik}\n`
      capt += `No. Kartu     : ${data.noKartu}\n`
      capt += `NAMA          : ${data.nama}\n`
      capt += `TGL LAHIR     : ${data.tglLahir}\n`
      capt += `JENIS KELAMIN : ${data.sex === 'L' ? 'Laki-laki' : 'Perempuan'}\n`
      capt += `STATUS        : ${data.statusPeserta.keterangan}\n`
      capt += `JENIS PESERTA : ${data.jenisPeserta.keterangan}\n`
      capt += `HAK KELAS     : ${data.hakKelas.keterangan}\n`
      capt += `PROVIDER      : ${data.provUmum.nmProvider}\n`
      capt += `TMT           : ${data.tglTMT}\n`
      capt += `TAT           : ${data.tglTAT}`
      await ctx.reply(`\`\`\`${capt}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      database[chatId].limit -= 1
      saveDatabase(database)
      delete userBPS[chatId]
    } catch(error) {
      console.log(error)
      delete userBPS[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userPSC[chatId]?.status) {
    try {
      const response = await cekSwab(input)
      if (response.sukses === 1) {
        return ctx.reply(response.error, {
          reply_to_message_id: ctx.message.message_id
        })
      }
      let capt = `OUTPUT\n`
      capt += `NIK           : ${response.nomor_identitas}\n`
      capt += `NAMA LENGKAP  : ${response.nama}\n`
      capt += `WARGANEGARA   : ${response.warganegara}\n`
      capt += `TGL LAHIR     : ${response.tgl_lahir}\n`
      capt += `ALAMAT DMSL   : ${response.alamat_domisili}\n`
      capt += `ALAMAT IDEN   : ${response.alamat_identitas}\n`
      capt += `NO RT         : ${response.rt}\n`
      capt += `NO RW         : ${response.rw}\n`
      capt += `TELEPON       : ${response.phone}`
      await ctx.reply(`\`\`\`${capt}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      database[chatId].limit -= 1
      saveDatabase(database)
      delete userPSC[chatId]
    } catch(error) {
      console.log(error)
      delete userPSC[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userDB[chatId]?.status) {
    if (!ctx.session) {
      ctx.session = {}
    }
    if (userSearchCache[chatId]?.query === input) {
      const { responses, numOfResults } = userSearchCache[chatId]
      ctx.session.currentIndex = ctx.session.currentIndex || 0
      const currentIndex = ctx.session.currentIndex + 1
      let replyMarkup = {};
      if (numOfResults > 1) {
        replyMarkup = {
          inline_keyboard: [
            [{ text: '◀️', callback_data: 'previous_result' },
             { text: `${currentIndex}/${numOfResults}`, callback_data: 'current_position' },
             { text: '▶️', callback_data: 'next_result' }]
          ]
        }
      }

      delete userDB[chatId]
      return ctx.reply(responses[ctx.session.currentIndex], {
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        reply_to_message_id: ctx.message.message_id
      })
    }
    try {
      const response = await axios.get(`http://47.245.93.152/request/leaks.php?request=${encodeURIComponent(input)}`)
      const data = response.data
      if (!data.List || Object.keys(data.List).length === 0) {
        return ctx.reply('Tidak ada data yang ditemukan untuk pencarian ini.', {
          reply_to_message_id: ctx.message.message_id
        })
      }
      const responses = generateResponses(data)
      const numOfResults = Object.keys(data.List).length
      userSearchCache[chatId] = { query: input, responses, numOfResults }
      ctx.session.currentIndex = 0
      let replyMarkup = {}
      if (numOfResults > 1) {
        replyMarkup = {
          inline_keyboard: [
            [{ text: '◀️', callback_data: 'previous_result' },
              { text: `1/${numOfResults}`, callback_data: 'current_position' },
              { text: '▶️', callback_data: 'next_result' }]
            ]
          }
        }
        database[chatId].limit -= 1
        saveDatabase(database)
        await ctx.reply(responses[0], {
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
          reply_to_message_id: ctx.message.message_id
        })
        delete userDB[chatId]
    } catch(error) {
      delete userDB[chatId]
      await ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userSDT[chatId]?.status) {
    try {
      const { data } = await axios.get(`http://47.245.93.152/request/leaks.php?request=${input}`)
      if (data.List['Dukcapil'].Data.length > 0) {
        searchResults[chatId] = { data: data.List["Dukcapil"].Data, page: 0 }
        sendPaginatedResult(ctx, chatId, true)
        database[chatId].limit -= 1
        saveDatabase(database)
        delete userSDT[chatId]
      } else {
        await ctx.reply('❌ Data tidak ditemukan. Harap coba nama lain.')
      }
    } catch {
      delete userSDT[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userDK[chatId]?.status) {
    try {
      const data = await Run(`${input}`)
      let capt = 'OUTPUT\n'
      data.forEach((item, index) => {
        capt += `ID             : ${index + 1}\n`
        capt += `NIK            : ${item.NIK}\n`
        capt += `No. Kartu BPJS : ${item["NO JKN-KIS"]}\n`
        capt += `Nama           : ${item.Nama}\n`
        capt += `Status         : ${item["Hubungan Keluarga"]}\n`
        capt += `Kepersetaan    : ${item["Status Kepesertaan"]}\n\n`
      })
      await ctx.reply(`\`\`\`${capt.trim()}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      delete userDK[chatId]
    } catch(error) {
      const data = await Run(`${input}`)
      let capt = 'OUTPUT\n'
      data.forEach((item, index) => {
        capt += `ID             : ${index + 1}\n`
        capt += `NIK            : ${item.NIK}\n`
        capt += `No. Kartu BPJS : ${item["NO JKN-KIS"]}\n`
        capt += `Nama           : ${item.Nama}\n`
        capt += `Status         : ${item["Hubungan Keluarga"]}\n`
        capt += `Kepersetaan    : ${item["Status Kepesertaan"]}\n\n`
      })
      await ctx.reply(`\`\`\`${capt.trim()}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      delete userDK[chatId]
    }
  } else if (userDEPO[chatId]?.status) {
    try {
      const total = await hitungHarga(input)
      const data = await createPayment(total)
      let capt = `Lakukan Pembayaran Sebesar "Rp ${formatNominal(data.data.total_price)}"\n`
      capt += `(Sudah Termasuk Biaya Admin)\n\n`
      capt += `QRIS Tersebut berlaku selama 5 menit\n\n`
      capt += `Tutorial:\n`
      capt += `1. Buka aplikasi yang mendukung pembayaran dengan QRIS\n`
      capt += `2. Pilih fitur QRIS / Bayar\n`
      capt += `3. Pindai kode QR yang diberikan oleh Merchant\n`
      capt += `4. Pastikan tagihan yang ditagihkan sesuai\n`
      capt += `5. Klik tombol Konfirmasi\n`
      capt += `6. Masukkan PIN untuk menyelesaikan pembayaran\n`
      capt += `7. Setelah pembayaran berhasil, kamu akan dialihkan ke Halaman Hasil Pembayaran`
      await ctx.replyWithPhoto(data.data.qris_url, {
        caption: capt,
        reply_to_message_id: ctx.message.message_id,
        reply_markup: {
          inline_keyboard: [[{
            text: 'CEK STATUS PEMBAYARAN', callback_data: 'cek_status_pembayaran'
          }]]
        }
      })
      userDEPO[chatId] = {
        status: 'pending',
        id: data.data.id,
        limit: input
      }
    } catch(error) {
      console.log(error)
      delete userDEPO[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userDPT[chatId]?.status === 'waiting_for_nik') {
    try {
      userDPT[chatId].nik = input
      userDPT[chatId].status = 'waiting_for_number'
      await ctx.reply('Silahkan Masukan NO (62):', {
        reply_to_message_id: ctx.message.message_id
      })
    } catch(error) {
      delete userDPT[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userDPT[chatId]?.status === 'waiting_for_number') {
    try {
      userDPT[chatId].number = input
      userDPT[chatId].status = 'waiting_for_otp'
      const kpu = new Kpu()
      const result = await kpu.cek({
        nik: userDPT[chatId].nik,
        number: input
      })
      userDPT[chatId].result = result
      await ctx.reply('Silahkan Masukan OTP yang sudah terkirim di nomer whatsapp anda.', {
        reply_to_message_id: ctx.message.message_id
      })
    } catch(error) {
      delete userDPT[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userDPT[chatId]?.status === 'waiting_for_otp') {
    try { 
      const result = await userDPT[chatId].result.otp(input)
      const item = result
      let capt = `OUTPUT\n`
      capt += `NIK           : ${item.nik}\n`
      capt += `NKK           : ${item.nkk}\n`
      capt += `NAMA LENGKAP  : ${item.nama}\n`
      capt += `KABUPATEN     : ${item.kabupaten}\n`
      capt += `PROVINSI      : ${item.provinsi ?? "-"}\n`
      capt += `KECAMATAN     : ${item.kecamatan}\n`
      capt += `KELURAHAN     : ${item.kelurahan}\n`
      capt += `TPS           : ${item.tps}\n`
      capt += `ALAMAT        : ${item.alamat}\n`
      capt += `LATITUDE      : ${item.lat}\n`
      capt += `LONGITUDE     : ${item.lon}\n`
      capt += `METODE        : ${item.metode}`
      await ctx.reply(`\`\`\`${capt}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      database[chatId].limit -=1
      saveDatabase(database)
      delete userDPT[chatId]
    } catch(error) {
      delete userDPT[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userSDTV[chatId]?.status) {
    try {
      const request = input.split(' & ')
      const { data } = await axios.get(`http://47.245.93.152/request/dukcapilv2.php?kota=${request[1]}&name=${request[0]}`)
      await ctx.reply(JSON.stringify(data, null, 2))
      delete userSDTV[chatId]
    } catch(error) {
      delete userSDTV[chatId]
      return ctx.reply(error.message, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else if (userTNKB[chatId]?.status) {
    try {
      const { data } = await axios.get(`http://47.245.93.152/request/plat.php?no=${input}`)
      let capt = `OUTPUT\n`
      capt += `PLAT NOMOR      : ${data.PlatNo || "-"}\n`
      capt += `NAMA PEMILIK    : ${data.NamaPemilik || "-"}\n`
      capt += `NIK             : ${data.NoKTP || "-"}\n`
      capt += `NO KK           : ${data.NoKK || "-"}\n`
      capt += `PEKERJAAN       : ${data.Pekerjaan || "-"}\n`
      capt += `ALAMAT          : ${data.Alamat || "-"}\n`
      capt += `MERK            : ${data.Merk || "-"}\n`
      capt += `TIPE            : ${data.Type || "-"}\n`
      capt += `TAHUN           : ${data.TahunPembuatan || "-"}\n`
      capt += `WARNA           : ${data.Warna || "-"}\n`
      capt += `JENIS KENDARAAN : ${data.JenisKendaraan || "-"}\n`
      capt += `MODEL           : ${data.ModelKendaraan || "-"}\n`
      capt += `BAHAN BAKAR     : ${data.BBM || "-"}\n`
      capt += `WARNA TNKB      : ${data.WarnaTNKB || "-"}\n`
      capt += `ISI CYLINDER    : ${data.IsiCylinder || "-"} CC\n`
      capt += `NO RANGKA       : ${data.NoRangka || "-"}\n`
      capt += `NO MESIN        : ${data.NoMesin || "-"}\n`
      capt += `NO BPKB         : ${data.NoBPKB || "-"}\n`
      capt += `NO STNK         : ${data.NoSTNK || "-"}\n`
      capt += `TANGGAL STNK    : ${data.TglSTNK || "-"}\n`
      capt += `TANGGAL FAKTUR  : ${data.TglFaktur || "-"}\n`
      capt += `APM             : ${data.APM || "-"}\n`
      capt += `TANGGAL DAFTAR  : ${data.TglDaftar || "-"}\n`
      capt += `TANGGAL PENGESAHAN : ${data.TglPengesahan || "-"}` 
      await ctx.reply(`\`\`\`${capt}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: ctx.message.message_id
      })
      delete userTNKB[chatId]
    } catch(error) {
      delete userTNKB[chatId]
      return ctx.reply(error.mesage, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  }
})

bot.action('cek_status_pembayaran', async (ctx) => {
  await ctx.answerCbQuery()
  const chatId = ctx.update.callback_query.from.id
  if (userDEPO[chatId]?.status === 'pending') {
    const status = await checkPayment(userDEPO[chatId].id)
    if (status.data.state === 'SUCCESS') {
      database[chatId].limit += Number(userDEPO[chatId].limit)
      database[chatId].status = 'Medium'
      saveDatabase(database)
      await ctx.reply('Transaksi telah berhasil dan limit Anda telah ditambahkan. Terima kasih telah menggunakan layanan kami.')
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id)
      delete userDEPO[chatId]
    } else {
      await ctx.reply('Transaksi tidak ditemukan atau tidak selesai')
    }
  }

})

bot.action('use_limit', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (userDEPO[chatId]?.status) {
    return ctx.editMessageText('Masih ada sesi yang belum diselesaikan.')
  }
  resetUserSession(chatId)
  if (!userDEPO[chatId]) userDEPO[chatId] = { status: false }
  userDEPO[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Masukan Jumlah Limit (10):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_nopol', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].status !== 'Premium') {
    return ctx.answerCbQuery('KHUSUS MEMBER PREMIUM', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userTNKB[chatId]) userTNKB[chatId] = { status: false }
  userTNKB[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NO / NIK (32):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_sdtv2', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].status !== 'Premium') {
    return ctx.answerCbQuery('KHUSUS MEMBER PREMIUM', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userSDTV[chatId]) userSDTV[chatId] = { status: false }
  userSDTV[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan Nama & Kota (Kemii & Jakarta):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_dpt', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].limit < 1) {
    return ctx.answerCbQuery('LIMIT ANDA SUDAH HABIS', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userDPT[chatId]) userDPT[chatId] = { status: false }
  userDPT[chatId].status = 'waiting_for_nik'

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NIK (32):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_dk', async (ctx) => {
  const username = ctx.chat.username || 'tidak ada'
  const chatId = ctx.update.callback_query.from.id
  return ctx.answerCbQuery('PERBAIKAN', { show_alert: true })
  if (database[chatId].status !== 'Premium') {
    return ctx.answerCbQuery('KHUSUS MEMBER PREMIUM', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userDK[chatId]) userDK[chatId] = { status: false }
  userDK[chatId].status = true

   try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NIK (32):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_sdt', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id

  if (database[chatId].limit < 1) {
    return ctx.answerCbQuery('LIMIT ANDA SUDAH HABIS', { show_alert: true })
  }

  resetUserSession(chatId)
  if (!userSDT[chatId]) userSDT[chatId] = { status: false }
  userSDT[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan Nama (Kemii):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_sdb', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].limit < 1) {
    return ctx.answerCbQuery('LIMIT ANDA SUDAH HABIS', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userDB[chatId]) userDB[chatId] = { status: false }
  userDB[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan Permintaan (Kemii):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_psc', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].limit < 1) {
    return ctx.answerCbQuery('LIMIT ANDA SUDAH HABIS', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userPSC[chatId]) userPSC[chatId] = { status: false }
  userPSC[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NIK (32):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_cds', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].limit < 1) {
    return ctx.answerCbQuery('LIMIT ANDA SUDAH HABIS', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userPTN[chatId]) userPTN[chatId] = { status: false }
  userPTN[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NO (62):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_cn', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].status !== 'Premium') {
    return ctx.answerCbQuery('KHUSUS MEMBER PREMIUM', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userPSN[chatId]) userPSN[chatId] = { status: false }
  userPSN[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NIK (32):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('use_bpjs', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  if (database[chatId].limit < 1) {
    return ctx.answerCbQuery('LIMIT ANDA SUDAH HABIS', { show_alert: true })
  }
  resetUserSession(chatId)
  if (!userBPS[chatId]) userBPS[chatId] = { status: false }
  userBPS[chatId].status = true

  try {
    const oldMessage = ctx.update.callback_query.message.text
    const newMessage = 'Silahkan Masukan NIK (32):'

    if (oldMessage === newMessage) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
      return
    }

    await ctx.editMessageText(newMessage)
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      console.log("Pesan sudah sama, tidak perlu diedit.")
    } else {
      console.error("Terjadi kesalahan:", error)
    }
  }
})

bot.action('prev', async ctx => {
  const chatId = ctx.update.callback_query.from.id

  if (userPTN[chatId]?.results) {
    const detailedResults = userPTN[chatId].results
    let index = userPTN[chatId].index
    index = (index - 1 + detailedResults.length) % detailedResults.length
    userPTN[chatId].index = index

    const createMessage = index => {
      const result = detailedResults[index]

      let capt = `OUTPUT\n`
      capt += `NIK              : ${result.ceknikData.nik}\n`
      capt += `NAMA             : ${result.ceknikData.nama}\n`
      capt += `JENIS KELAMIN    : ${result.ceknikData.jenis_kelamin}\n`
      capt += `PEKERJAAN        : ${result.ceknikData.jenisPeserta}\n`
      capt += `TGL LAHIR        : ${result.ceknikData.tanggal_lahir}\n`
      capt += `PROVINSI         : ${result.ceknikData.provinsi}\n`
      capt += `Kabupaten/Kota   : ${result.ceknikData.kabupaten_kota}\n`
      capt += `KECAMATAN        : ${result.ceknikData.kecamatan}\n\n`
      capt += `Result ${index + 1} dari ${detailedResults.length}`

      return capt
    }

    const capt = createMessage(index)

    await ctx.editMessageText(`\`\`\`${capt}\`\`\``, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Back', callback_data: 'prev' },
            { text: 'Next', callback_data: 'next' }
          ]
        ]
      }
    })
  }
})

bot.action('next', async ctx => {
  const chatId = ctx.update.callback_query.from.id

  if (userPTN[chatId]?.results) {
    const detailedResults = userPTN[chatId].results
    let index = userPTN[chatId].index
    index = (index + 1) % detailedResults.length
    userPTN[chatId].index = index

    const createMessage = index => {
      const result = detailedResults[index]

      let capt = `OUTPUT\n`
      capt += `NIK              : ${result.ceknikData.nik}\n`
      capt += `NAMA             : ${result.ceknikData.nama}\n`
      capt += `JENIS KELAMIN    : ${result.ceknikData.jenis_kelamin}\n`
      capt += `PEKERJAAN        : ${result.ceknikData.jenisPeserta}\n`
      capt += `TGL LAHIR        : ${result.ceknikData.tanggal_lahir}\n`
      capt += `PROVINSI         : ${result.ceknikData.provinsi}\n`
      capt += `Kabupaten/Kota   : ${result.ceknikData.kabupaten_kota}\n`
      capt += `KECAMATAN        : ${result.ceknikData.kecamatan}\n\n`
      capt += `Result ${index + 1} dari ${detailedResults.length}`

      return capt
    }

    const capt = createMessage(index)

    await ctx.editMessageText(`\`\`\`${capt}\`\`\``, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Back', callback_data: 'prev' },
            { text: 'Next', callback_data: 'next' }
          ]
        ]
      }
    })
  }
})

bot.action('next_result', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  const cache = userSearchCache[chatId]
  if (!cache || !cache.responses) return ctx.reply('Data tidak ditemukan.')

  if (!ctx.session) {
    ctx.session = {}
  }

  if (ctx.session.currentIndex === undefined) {
    ctx.session.currentIndex = 0
  }

  const nextIndex = (ctx.session.currentIndex + 1) % cache.responses.length
  const response = cache.responses[nextIndex]
  const numOfResults = cache.numOfResults
  const currentIndex = nextIndex + 1

  const currentMessage = ctx.update.callback_query.message
  const currentText = currentMessage.text;
  const currentMarkup = currentMessage.reply_markup

  const newMarkup = {
    inline_keyboard: [
      [{ text: '◀️', callback_data: 'previous_result' },
       { text: `${currentIndex}/${numOfResults}`, callback_data: 'current_position' },
       { text: '▶️', callback_data: 'next_result' }]
    ]
  }

  const isTextChanged = currentText !== response
  const isMarkupChanged = JSON.stringify(currentMarkup) !== JSON.stringify(newMarkup);

  if (isTextChanged || isMarkupChanged) {
    ctx.session.currentIndex = nextIndex
    await ctx.editMessageText(response, {
      parse_mode: 'HTML',
      reply_markup: newMarkup
    })
  }
})

bot.action('previous_result', async (ctx) => {
  const chatId = ctx.update.callback_query.from.id
  const cache = userSearchCache[chatId]
  if (!cache || !cache.responses) return ctx.reply('Data tidak ditemukan.')

  if (!ctx.session) {
    ctx.session = {}
  }

  if (ctx.session.currentIndex === undefined) {
    ctx.session.currentIndex = 0
  }

  const prevIndex = (ctx.session.currentIndex - 1 + cache.responses.length) % cache.responses.length
  const response = cache.responses[prevIndex]
  const numOfResults = cache.numOfResults
  const currentIndex = prevIndex + 1

  const currentMessage = ctx.update.callback_query.message
  const currentText = currentMessage.text
  const currentMarkup = currentMessage.reply_markup

  const newMarkup = {
    inline_keyboard: [
      [{ text: '◀️', callback_data: 'previous_result' },
       { text: `${currentIndex}/${numOfResults}`, callback_data: 'current_position' },
       { text: '▶️', callback_data: 'next_result' }]
    ]
  }

  const isTextChanged = currentText !== response
  const isMarkupChanged = JSON.stringify(currentMarkup) !== JSON.stringify(newMarkup)

  if (isTextChanged || isMarkupChanged) {
    ctx.session.currentIndex = prevIndex
    await ctx.editMessageText(response, {
      parse_mode: 'HTML',
      reply_markup: newMarkup
    })
  }
})

bot.action(/^next_(\d+)$/, async (ctx) => {
  const chatId = ctx.match[1]
  if (!searchResults[chatId]) return

  searchResults[chatId].page++
  await ctx.answerCbQuery()
  sendPaginatedResult(ctx, chatId)
})

bot.action(/^prev_(\d+)$/, async (ctx) => {
  const chatId = ctx.match[1]
  if (!searchResults[chatId]) return

  searchResults[chatId].page--
  await ctx.answerCbQuery()
  sendPaginatedResult(ctx, chatId)
})

bot.action(/^nextt_(\d+)$/, async (ctx) => {
  const chatId = ctx.match[1]
  if (!searchResults[chatId]) return

  searchResults[chatId].page++
  await ctx.answerCbQuery()
  studentResult(ctx, chatId)
})

bot.action(/^prevv_(\d+)$/, async (ctx) => {
  const chatId = ctx.match[1]
  if (!searchResults[chatId]) return

  searchResults[chatId].page--
  await ctx.answerCbQuery()
  studentResult(ctx, chatId)
})

async function checkPayment(id) {
  try {
    const { data } = await axios.get('https://kenshinaru-api.hf.space/pay-check', {
      params: {
        orkut_id: 'OK1156153',
        orkut_apikey: '583791417108436561156153OKCT12F72A0DB3C753E2E4050A1D91DB735C',
        id: id
      }
    })
    return data
  } catch(error) {
    return error.message
  }
}

async function createPayment(amount) {
  try {
    const { data } = await axios.get('https://kenshinaru-api.hf.space/create-pay', {
      params: {
        qris_id: '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214438571841147830303UMI51440014ID.CO.QRIS.WWW0215ID20232630121300303UMI5204481253033605802ID5922KEMII DENPAI OK11561536007CIANJUR61054321162070703A016304CAE2',
        amount: amount
      }
    })
    return data
  } catch(error) {
    return error.message
  }
}

async function splitMessage (text, maxLength = 4096, callback) {
  const parts = []
  while (text.length > maxLength) {
    let splitIndex = text.lastIndexOf('\n', maxLength)
    if (splitIndex === -1) splitIndex = maxLength
    parts.push(text.slice(0, splitIndex))
    text = text.slice(splitIndex).trim()
  }
  parts.push(text)
  if (callback && typeof callback === 'function') {
    for (const part of parts) {
      await callback(part)
    }
  }
  return parts
}

async function sendMessageParts(ctx, text, maxLength = 4096) {
  await splitMessage(text, maxLength, async (part) => {
    await ctx.reply(part, {
      parse_mode: 'Markdown',
    })
  })
}

async function sendMessageParts2(ctx, text, maxLength = 4096) {
  await splitMessage(text, maxLength, async (part) => {
    await ctx.reply(part, {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id,
    })
  })
}

function parseDuration(duration) {
  if (!duration) return null
  const match = duration.match(/(\d+)([dhm])/)
  if (!match) return null
  const value = parseInt(match[1])
  const unit = match[2]
  const now = Date.now()
  return unit === 'd' ? now + value * 86400000 : unit === 'h' ? now + value * 3600000 : now + value * 60000
}

function deletePremium(ctx, id = null) {
  const db = database
  if (id) {
    if (db[id] && db[id].status && db[id].status.toLowerCase() === 'premium') {
      db[id].status = 'Gratisan'
      delete db[id].premiumUntil
      saveDatabase(db)
      ctx.reply(`Premium status for ID ${id} has been removed.`, {
        reply_to_message_id: ctx.message.message_id
      })
    } else {
      ctx.reply(`ID ${id} is not premium or does not exist.`, {
        reply_to_message_id: ctx.message.message_id
      })
    }
  } else {
    let count = 0
    for (let userId in db) {
      if (db[userId].status && db[userId].status.toLowerCase() === 'premium') {
        db[userId].status = 'Gratisan'
        delete db[userId].premiumUntil
        count++
      }
    }
    saveDatabase(db)
    ctx.reply(`${count} premium statuses have been removed.`, {
      reply_to_message_id: ctx.message.message_id
    })
  }
}

function addPremium(ctx, id, duration = null) {
  const db = database
  if (!db[id]) db[id] = {}
  db[id].status = 'Premium'
  db[id].limit = 666999
  db[id].premiumUntil = parseDuration(duration)
  saveDatabase(db)
  ctx.reply(`ID ${id} has been granted premium status${duration ? ` for ${duration}` : ' permanently'}.`, {
    reply_to_message_id: ctx.message.message_id
  })
}

function checkPremiums() {
  const db = database
  const now = Date.now()
  let count = 0
  for (let id in db) {
    if (db[id].status === 'Premium' && db[id].premiumUntil && db[id].premiumUntil < now) {
      db[id].status = 'Gratisan'
      delete db[id].premiumUntil
      bot.telegram.sendMessage(id, 'Your premium status has expired and reverted to Gratisan.')
      count++
    }
  }
  if (count > 0) saveDatabase(db)
}
setInterval(checkPremiums, 60000)

function formatResult(source, entry) {
  let result = ``
  for (const [key, value] of Object.entries(entry)) {
    result += `<b>${key}:</b> ${value}\n`
  }
  return result
}

function splitMessage(text, maxLength = 4000) {
  if (text.length <= maxLength) return [text]

  const warning = "\n\n[Pesan dipotong karena terlalu panjang...]"
  const parts = []
  let i = 0

  while (i < text.length) {
    let chunk = text.substring(i, i + maxLength - warning.length)
    i += maxLength - warning.length

    if (i < text.length) {
      parts.push(chunk + warning)
    } else {
      parts.push(chunk)
    }
  }

  return parts
}

function generateResponses(data) {
  const responses = []
  for (const [source, sourceData] of Object.entries(data.List)) {
    const { Data, InfoLeak } = sourceData
    let response = `<b>${source}</b>\n\n${InfoLeak}\n\n`
    
    Data.forEach(entry => {
      response += formatResult(source, entry) + '\n'
    })
    
    responses.push(...splitMessage(response))
  }
  return responses
}

function hitungHarga(limit) {
    const hargaPerLimit = 500
    return limit * hargaPerLimit
}

function base64ToBuffer(base64String) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

function formatNominal(nominal) {
    return nominal
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        .replace(/\.([0-9]{3})$/, ",$1");
}

function resetUserSession(chatId) {
    if (userDB[chatId]) userDB[chatId].status = false
    if (userGTC[chatId]) userGTC[chatId].status = false
    if (userTNKB[chatId]) userTNKB[chatId].status = false
    if (userSDT[chatId]) userSDT[chatId].status = false
    if (userPSN[chatId]) userPSN[chatId].status = false
    if (userPTN[chatId]) userPTN[chatId].status = false
    if (userBPS[chatId]) userBPS[chatId].status = false
    if (userDK[chatId]) userDK[chatId].status = false
    if (userDEPO[chatId]) userDEPO[chatId].status = false
    if (userPSC[chatId]) userPSC[chatId].status = false
    if (userSDTV[chatId]) userSDTV[chatId].status = false
}

function resetLimitAndNotifyUsers() {
  const usersToNotify = []

  Object.keys(database).forEach((key) => {
    if (database[key].status === 'UserDX') {
      database[key].limit = 10
      usersToNotify.push({ chatId: key, name: database[key].name })
    }
  })
  saveDatabase(database)
  console.log('Mereset limit UserDX.')
}

function sendPaginatedResult(ctx, chatId, isNew = false) {
  const results = searchResults[chatId]
  if (!results) return

  const perPage = 1
  const totalPages = Math.ceil(results.data.length / perPage)
  const page = results.page
  const start = page * perPage
  const end = start + perPage
  const items = results.data.slice(start, end)

  let capt = `OUTPUT\n`
  items.forEach((item) => {
    capt += `ID            : ${page + 1}\n`
    capt += `NAMA          : ${item.FullName.toUpperCase()}\n`
    capt += `NIK           : ${item.Passport}\n`
    capt += `KELAMIN       : ${item.Gender.toUpperCase()}\n`
    capt += `TGL LAHIR     : ${item.BDay}\n`
    capt += `TELEPON       : ${item.Phone}\n`
    capt += `ALAMAT        : ${item.Address.toUpperCase()}\n`
    capt += `KELURAHAN     : ${item.District.toUpperCase()}\n`
    capt += `KOTA          : ${item.Region.toUpperCase()}\n\n`
    capt += `Halaman ${page + 1} dari ${totalPages}`
  })

  let buttons = []
  if (totalPages > 1) {
    buttons.push({ text: 'Back', callback_data: `prev_${chatId}` })
    buttons.push({ text: 'Next', callback_data: `next_${chatId}` })
  }

  if (isNew) {
    ctx.reply(`\`\`\`${capt.trim()}\`\`\``, {
      parse_mode: 'MarkdownV2',
      reply_markup: buttons.length ? { inline_keyboard: [buttons] }
      : undefined,
      reply_to_message_id: ctx.message.message_id
    }).then((sentMessage) => {
      searchResults[chatId].message_id = sentMessage.message_id
    })
  } else {
    const messageId = searchResults[chatId].message_id
    if (messageId) {
      ctx.telegram.editMessageText(ctx.chat.id, messageId, null, `\`\`\`${capt.trim()}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_markup: buttons.length ? { inline_keyboard: [buttons] } : undefined
      }).catch(async (err) => {
        console.log('Error editing message:', err.message)
        ctx.telegram.deleteMessage(ctx.chat.id, messageId).catch(() => {})
        ctx.reply(`\`\`\`${capt.trim()}\`\`\``, {
          parse_mode: 'MarkdownV2',
          reply_markup: buttons.length ? { inline_keyboard: [buttons] } : undefined,
          reply_to_message_id: ctx.message.message_id
        }).then((newMessage) => {
          searchResults[chatId].message_id = newMessage.message_id
        })
      })
    }
  }
}

function studentResult(ctx, chatId, isNew = false) {
  const results = searchResults[chatId]
  if (!results) return

  const perPage = 1
  const totalPages = Math.ceil(results.data.length / perPage)
  const page = results.page
  const start = page * perPage
  const end = start + perPage
  const items = results.data.slice(start, end)

  let capt = `OUTPUT\n\n`
  items.forEach((item) => {
    capt += `Nama             : ${item.nama}\n`
    capt += `NIM              : ${item.nim}\n`
    capt += `Jenis Kelamin    : ${item.jenis_kelamin}\n`
    capt += `Perguruan Tinggi : ${item.nama_pt}\n`
    capt += `Kode PT          : ${item.kode_pt.trim()}\n`
    capt += `Kode Prodi       : ${item.kode_prodi}\n`
    capt += `Program Studi    : ${item.prodi}\n`
    capt += `Jenjang          : ${item.jenjang}\n`
    capt += `Jenis Daftar     : ${item.jenis_daftar}\n`
    capt += `Status Saat Ini  : ${item.status_saat_ini}\n`
    capt += `Tanggal Masuk    : ${item.tanggal_masuk.split('T')[0]}\n\n`
    capt += `Halaman ${page + 1} dari ${totalPages}`
  })

  let buttons = []
  if (totalPages > 1) {
    buttons.push({ text: 'Back', callback_data: `prevv_${chatId}` })
    buttons.push({ text: 'Next', callback_data: `nextt_${chatId}` })
  }

  if (isNew) {
    ctx.reply(`*Informasi Siswa:*\n\n\`\`\`${capt.trim()}\`\`\``, {
      parse_mode: 'MarkdownV2',
      reply_markup: buttons.length ? { inline_keyboard: [buttons] }
      : { inline_keyboard: [[{ text: "Premium", url: "https://t.me/HeyyKemii" }]] },
      reply_to_message_id: ctx.message.message_id
    }).then((sentMessage) => {
      searchResults[chatId].message_id = sentMessage.message_id
    })
  } else {
    const messageId = searchResults[chatId].message_id
    if (messageId) {
      ctx.telegram.editMessageText(ctx.chat.id, messageId, null, `*Informasi Siswa:*\n\n\`\`\`${capt.trim()}\`\`\``, {
        parse_mode: 'MarkdownV2',
        reply_markup: buttons.length ? { inline_keyboard: [buttons] } : undefined
      }).catch(async (err) => {
        console.log('Error editing message:', err.message)
        ctx.telegram.deleteMessage(ctx.chat.id, messageId).catch(() => {})
        ctx.reply(`*Informasi Siswa:*\n\n\`\`\`${capt.trim()}\`\`\``, {
          parse_mode: 'MarkdownV2',
          reply_markup: buttons.length ? { inline_keyboard: [buttons] } : undefined
        }).then((newMessage) => {
          searchResults[chatId].message_id = newMessage.message_id
        })
      })
    }
  }
}

module.exports = bot