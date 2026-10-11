import { readFileSync, writeFileSync } from 'node:fs';
import {
    assertUniqueIds,
    summarize,
    type ContentDump,
    type ExportedStep,
    type ExportedUnit,
} from './export-content.mts';

type Concept = { title: string; body: string; code: string };
type Quiz = {
    question: string;
    code: string;
    options: string[];
    explanation: string;
};
type Fill = {
    title: string;
    instructions: string;
    parts: string[];
    options: string[][];
    hint: string;
};
type Lesson = {
    title: string;
    description: string;
    concepts: Concept[];
    quizzes: Quiz[];
    fills: Fill[];
};
const c = (title: string, body: string, code: string): Concept => ({
    title,
    body,
    code,
});
const q = (
    question: string,
    code: string,
    options: string[],
    explanation: string,
): Quiz => ({ question, code, options, explanation });
const f = (
    title: string,
    instructions: string,
    parts: string[],
    options: string[][],
    hint: string,
): Fill => ({ title, instructions, parts, options, hint });

const lessons: Lesson[] = [
    {
        title: 'Membaca Input dan Mengubah Tipe',
        description:
            'Menerima masukan pengguna dan mengubah teks angka menjadi bilangan.',
        concepts: [
            c(
                'input() selalu menghasilkan string',
                'Gunakan input() untuk membaca satu baris masukan. Teks dalam tanda kurung menjadi pesan untuk pengguna. Walaupun pengguna mengetik 12, hasilnya tetap string "12". Simpan hasil input dalam variabel agar dapat dipakai kembali.',
                'nama = input("Nama kamu: ")\nprint(nama)',
            ),
            c(
                'Ubah angka sebelum menghitung',
                'int() mengubah teks bilangan bulat menjadi integer. float() dipakai untuk bilangan desimal dengan titik. Setelah dikonversi, angka dapat dijumlahkan. Teks "3" dan "4" yang digabung menghasilkan "34", sedangkan angka 3 + 4 menghasilkan 7.',
                'jumlah = int("3")\nharga = float("2.5")\nprint(jumlah * harga)',
            ),
            c(
                'Tidak semua teks dapat menjadi angka',
                'int("dua") menimbulkan ValueError karena isinya bukan penulisan bilangan bulat. int("2.5") juga gagal; teks itu harus dibaca dengan float(). Untuk latihan ini, anggap pengguna memasukkan angka yang sesuai. Penanganan input tidak valid akan dipelajari kemudian.',
                'umur = int(input("Umur: "))\nprint(umur + 1)',
            ),
        ],
        quizzes: [
            q(
                'Pengguna mengetik 12. Apa tipe nilai umur sebelum dikonversi?',
                'umur = input("Umur: ")',
                ['str', 'int', 'float', 'bool'],
                'input() mengembalikan string, termasuk ketika pengguna mengetik angka.',
            ),
            q(
                'Apa output kode berikut?',
                'jumlah = int("3")\nprint(jumlah + 4)',
                ['7', '34', '3', 'ValueError'],
                'int("3") menghasilkan integer 3, sehingga 3 + 4 bernilai 7.',
            ),
            q(
                'Konversi mana yang cocok untuk teks "2.5"?',
                '',
                ['float("2.5")', 'int("2.5")', 'bool("2.5")', 'input("2.5")'],
                'float() membaca angka desimal bertitik; int() tidak menerima teks desimal.',
            ),
        ],
        fills: [
            f(
                'Baca nama pengguna',
                'Pilih fungsi untuk menerima masukan pengguna.',
                ['nama = ', '("Nama: ")\nprint(nama)'],
                [['input', 'print', 'str', 'len']],
                'Fungsi yang dibutuhkan membaca masukan, bukan mencetaknya.',
            ),
            f(
                'Hitung umur berikutnya',
                'Ubah input menjadi bilangan bulat, lalu tambahkan satu.',
                ['umur = ', '(input("Umur: "))\nprint(umur ', ' 1)'],
                [
                    ['int', 'str', 'float'],
                    ['+', '-', '*'],
                ],
                'Umur pada latihan ini adalah bilangan bulat.',
            ),
        ],
    },
    {
        title: 'Menyusun Pesan dengan f-string',
        description:
            'Memasukkan nilai variabel dan format angka ke dalam pesan.',
        concepts: [
            c(
                'Sisipkan nilai dengan kurung kurawal',
                'Tambahkan huruf f sebelum tanda kutip. Ekspresi di dalam { } akan dihitung lalu dimasukkan ke string. Tanpa awalan f, kurung kurawal dan nama variabel tampil sebagai teks biasa. Gunakan cara ini untuk membuat sapaan dari data pengguna.',
                'nama = "Nara"\nprint(f"Halo, {nama}!")',
            ),
            c(
                'Gabungkan beberapa nilai',
                'Satu f-string dapat memuat beberapa variabel maupun perhitungan. Nama variabel tetap harus sudah didefinisikan. Pesan seperti ini lebih mudah dibaca dibanding menggabungkan banyak string dan memanggil str() berulang kali.',
                'barang = "Buku"\njumlah = 3\nprint(f"{jumlah} buah {barang}")',
            ),
            c(
                'Atur tampilan desimal',
                'Format :.2f menampilkan dua angka setelah titik. Pengaturan ini mengubah teks yang ditampilkan, bukan nilai asli variabel. Jangan menganggap format tampilan sebagai pengganti aturan pembulatan uang untuk aplikasi keuangan nyata.',
                'nilai = 8.5\nprint(f"Nilai: {nilai:.2f}")\nprint(nilai)',
            ),
        ],
        quizzes: [
            q(
                'Apa output kode berikut?',
                'nama = "Nara"\nprint(f"Halo, {nama}!")',
                ['Halo, Nara!', 'Halo, {nama}!', 'Halo, nama!', 'Nara'],
                'Awalan f membuat {nama} diganti dengan nilai variabel nama.',
            ),
            q(
                'Apa output kode berikut?',
                'jumlah = 3\nprint(f"Total: {jumlah * 2}")',
                ['Total: 6', 'Total: jumlah * 2', 'Total: 3', 'Total: 32'],
                'Ekspresi jumlah * 2 dihitung menjadi 6 sebelum dimasukkan ke pesan.',
            ),
            q(
                'Bagaimana nilai ditampilkan oleh kode berikut?',
                'nilai = 8.5\nprint(f"{nilai:.2f}")',
                ['8.50', '8.5', '8.500', '85'],
                'Format .2f menampilkan dua angka di belakang titik.',
            ),
        ],
        fills: [
            f(
                'Aktifkan f-string',
                'Lengkapi awalan string agar nilai nama masuk ke pesan.',
                ['nama = "Nara"\nprint(', '"Halo, {nama}!")'],
                [['f', 'r', 'b', 'str']],
                'Awalan yang dipakai untuk interpolasi adalah satu huruf.',
            ),
            f(
                'Masukkan skor ke pesan',
                'Pilih variabel dan format untuk menampilkan nilai 9.5 sebagai 9.50.',
                ['skor = 9.5\nprint(f"Skor: {', ':', '}")'],
                [
                    ['skor', 'nilai', '9'],
                    ['.2f', '.0f', '.3f'],
                ],
                'Gunakan nama variabel yang tersedia dan dua angka desimal.',
            ),
        ],
    },
    {
        title: 'Mengolah Teks dan Mengambil Bagiannya',
        description:
            'Mengakses karakter, melakukan slicing, dan membersihkan teks.',
        concepts: [
            c(
                'Indeks karakter dimulai dari nol',
                'Karakter pertama berada pada indeks 0. Indeks -1 menunjuk karakter terakhir. len() menghitung banyak karakter, termasuk spasi. String tidak dapat diubah dengan menulis langsung ke satu indeks; buat string baru jika ingin mengubah isinya.',
                'kata = "Python"\nprint(kata[0])\nprint(kata[-1])\nprint(len(kata))',
            ),
            c(
                'Batas akhir slice tidak ikut diambil',
                'Penulisan teks[start:stop] mengambil karakter mulai dari start hingga sebelum stop. Jika start dihilangkan, pengambilan dimulai dari awal. Jika stop dihilangkan, pengambilan diteruskan sampai akhir. Slicing mengembalikan string baru.',
                'kata = "Python"\nprint(kata[0:3])\nprint(kata[3:])',
            ),
            c(
                'Metode string menghasilkan teks baru',
                'strip() menghapus spasi di kedua ujung teks, bukan di tengah. lower() mengubah huruf menjadi kecil, sedangkan upper() menjadi besar. Simpan hasilnya bila ingin memakai teks yang sudah dibersihkan; variabel sumber tidak otomatis berubah.',
                'nama = "  Nara  "\nbersih = nama.strip().lower()\nprint(bersih)\nprint(nama)',
            ),
        ],
        quizzes: [
            q(
                'Karakter apa yang ditampilkan?',
                'kata = "Python"\nprint(kata[-1])',
                ['n', 'P', 'o', 'Tidak ada karakter'],
                'Indeks -1 mengambil karakter terakhir, yaitu n.',
            ),
            q(
                'Apa output kode berikut?',
                'kata = "Python"\nprint(kata[0:3])',
                ['Pyt', 'Pyth', 'yth', 'Python'],
                'Indeks 0, 1, dan 2 diambil. Indeks 3 tidak disertakan.',
            ),
            q(
                'Apa output kode berikut?',
                'teks = "  Halo  "\nprint(teks.strip().upper())',
                ['HALO', 'halo', '  HALO  ', 'Halo'],
                'strip() membersihkan spasi ujung, lalu upper() membuat huruf kapital.',
            ),
        ],
        fills: [
            f(
                'Ambil karakter pertama',
                'Lengkapi indeks untuk menampilkan huruf P.',
                ['kata = "Python"\nprint(kata[', '])'],
                [['0', '1', '-1', '6']],
                'Indeks pertama selalu dimulai dari nol.',
            ),
            f(
                'Bersihkan nama',
                'Hapus spasi ujung lalu ubah huruf menjadi kecil.',
                ['nama = "  NARA  "\nprint(nama.', '().', '())'],
                [
                    ['strip', 'upper', 'split'],
                    ['lower', 'strip', 'upper'],
                ],
                'Pembersihan spasi dilakukan sebelum perubahan huruf.',
            ),
        ],
    },
    {
        title: 'Menggabungkan Kondisi',
        description: 'Membaca and, or, not, dan operator keanggotaan.',
        concepts: [
            c(
                'and membutuhkan kedua kondisi benar',
                'Gunakan and saat dua syarat harus dipenuhi sekaligus. Contohnya, peserta boleh masuk jika usia cukup dan sudah memiliki tiket. Hasil perbandingan dapat disimpan sebagai boolean agar aturan mudah diperiksa dan nama variabel menjelaskan maksudnya.',
                'umur = 18\npunya_tiket = True\nboleh_masuk = umur >= 17 and punya_tiket\nprint(boleh_masuk)',
            ),
            c(
                'or cukup dengan satu kondisi benar',
                'Gunakan or saat salah satu syarat sudah cukup. not membalik nilai kebenaran: not True menjadi False. Pakai kurung untuk memperjelas pengelompokan kondisi yang panjang. Dalam contoh ini semua operand kondisi berupa boolean.',
                'anggota = False\npunya_kupon = True\nprint(anggota or punya_kupon)\nprint(not anggota)',
            ),
            c(
                'Periksa keanggotaan dengan in',
                'Operator in memeriksa apakah sebuah nilai ada di koleksi. Pada string, in memeriksa apakah suatu potongan teks muncul di dalamnya. not in membalik hasil pemeriksaan. Pencocokan string membedakan huruf besar dan kecil.',
                'buah = ["apel", "jeruk"]\nprint("apel" in buah)\nprint("mangga" not in buah)',
            ),
        ],
        quizzes: [
            q(
                'Apa hasil kondisi berikut?',
                'umur = 16\npunya_tiket = True\nprint(umur >= 17 and punya_tiket)',
                ['False', 'True', '16', 'Error'],
                'Syarat umur tidak terpenuhi. and memerlukan kedua syarat benar.',
            ),
            q(
                'Apa output kode berikut?',
                'anggota = False\npunya_kupon = True\nprint(anggota or punya_kupon)',
                ['True', 'False', 'None', 'Error'],
                'or bernilai True karena punya_kupon bernilai True.',
            ),
            q(
                'Apa output kode berikut?',
                'buah = ["apel", "jeruk"]\nprint("mangga" not in buah)',
                ['True', 'False', 'mangga', 'None'],
                'mangga tidak ada dalam list, sehingga not in menghasilkan True.',
            ),
        ],
        fills: [
            f(
                'Penuhi kedua syarat',
                'Isi operator agar peserta harus cukup umur dan memiliki tiket.',
                ['boleh = umur >= 17 ', ' punya_tiket'],
                [['and', 'or', 'not', 'in']],
                'Kedua syarat wajib benar.',
            ),
            f(
                'Periksa barang yang tersedia',
                'Periksa apakah buku ada dalam list, lalu balik status habis.',
                [
                    'barang = ["buku", "pensil"]\nada = "buku" ',
                    ' barang\nhabis = ',
                    ' ada',
                ],
                [
                    ['in', 'and', 'or'],
                    ['not', 'in', 'and'],
                ],
                'in memeriksa keanggotaan, not membalik boolean.',
            ),
        ],
    },
    {
        title: 'Memilih Banyak Cabang dengan elif',
        description:
            'Menyusun beberapa kemungkinan dengan urutan kondisi yang tepat.',
        concepts: [
            c(
                'elif menambahkan kondisi alternatif',
                'if memeriksa kondisi pertama. Jika salah, Python mencoba elif berikutnya. else digunakan jika semua kondisi sebelumnya salah. Dalam satu rantai if–elif–else, hanya cabang pertama yang kondisinya benar yang dijalankan.',
                'nilai = 75\nif nilai >= 80:\n    print("A")\nelif nilai >= 60:\n    print("B")\nelse:\n    print("C")',
            ),
            c(
                'Urutkan batas dari yang paling ketat',
                'Untuk kelompok nilai dengan batas minimum, periksa batas terbesar terlebih dahulu. Jika nilai >= 60 ditempatkan sebelum nilai >= 80, nilai 90 akan masuk ke cabang pertama. Python tidak mencari cabang yang paling cocok setelah menemukan kondisi benar.',
                'nilai = 90\nif nilai >= 80:\n    kategori = "A"\nelif nilai >= 60:\n    kategori = "B"\nelse:\n    kategori = "C"',
            ),
            c(
                'Beberapa if berbeda dari satu rantai elif',
                'Dua if yang terpisah diperiksa secara mandiri, sehingga keduanya dapat berjalan. Gunakan elif jika pilihan harus saling meniadakan. Setiap kondisi diakhiri titik dua dan isi cabang diberi indentasi yang konsisten.',
                'nilai = 90\nif nilai >= 60:\n    print("Lulus")\nif nilai >= 80:\n    print("Nilai tinggi")',
            ),
        ],
        quizzes: [
            q(
                'Apa output kode berikut?',
                'nilai = 75\nif nilai >= 80:\n    print("A")\nelif nilai >= 60:\n    print("B")\nelse:\n    print("C")',
                ['B', 'A', 'C', 'A lalu B'],
                'Kondisi pertama salah, lalu nilai >= 60 benar sehingga B dicetak.',
            ),
            q(
                'Apa output kode berikut?',
                'nilai = 90\nif nilai >= 60:\n    print("B")\nelif nilai >= 80:\n    print("A")',
                ['B', 'A', 'B lalu A', 'Tidak ada output'],
                'Cabang pertama sudah benar, sehingga elif tidak diperiksa.',
            ),
            q(
                'Berapa baris output yang dihasilkan?',
                'nilai = 90\nif nilai >= 60:\n    print("Lulus")\nif nilai >= 80:\n    print("Nilai tinggi")',
                ['2', '1', '0', '3'],
                'Kedua if berdiri sendiri dan kedua kondisinya benar.',
            ),
        ],
        fills: [
            f(
                'Tambahkan cabang tengah',
                'Lengkapi kata kunci untuk kondisi kedua dan cabang terakhir.',
                [
                    'if nilai >= 80:\n    print("A")\n',
                    ' nilai >= 60:\n    print("B")\n',
                    ':\n    print("C")',
                ],
                [
                    ['elif', 'else', 'for'],
                    ['else', 'elif', 'if'],
                ],
                'elif memiliki kondisi; else tidak memiliki kondisi.',
            ),
            f(
                'Periksa batas kelulusan',
                'Nilai 60 atau lebih dinyatakan lulus.',
                ['nilai = 60\nif nilai ', ' 60:\n    print("Lulus")'],
                [['>=', '>', '==', '<']],
                'Batasnya mencakup nilai 60 dan nilai yang lebih besar.',
            ),
        ],
    },
    {
        title: 'Mengendalikan Loop dengan break dan continue',
        description:
            'Menghentikan pencarian dan melewati item tertentu dalam perulangan.',
        concepts: [
            c(
                'break menghentikan loop terdekat',
                'Gunakan break ketika tujuan pencarian sudah tercapai. Setelah break, Python melanjutkan ke baris setelah loop. Pada loop bersarang, break hanya menghentikan loop tempat ia berada. Contoh ini berhenti sebelum angka 3 dicetak.',
                'for angka in range(5):\n    if angka == 3:\n        break\n    print(angka)',
            ),
            c(
                'continue melewati sisa iterasi saat ini',
                'continue tidak menghentikan seluruh loop. Ia melewati baris yang tersisa pada putaran saat ini, lalu melanjutkan putaran berikutnya. Cara ini berguna untuk mengabaikan data yang tidak ingin diproses. Dalam while, pastikan perubahan pencacah tidak terlewati.',
                'for angka in range(4):\n    if angka == 2:\n        continue\n    print(angka)',
            ),
            c(
                'range memiliki batas akhir eksklusif',
                'range(1, 6, 2) menghasilkan 1, 3, dan 5. Argumennya adalah awal, batas akhir yang tidak disertakan, dan langkah. Nilai langkah tidak boleh nol. Gunakan range untuk jumlah pengulangan yang diketahui, dan iterasi langsung untuk membaca isi koleksi.',
                'for angka in range(1, 6, 2):\n    print(angka)',
            ),
        ],
        quizzes: [
            q(
                'Urutan angka apa yang dicetak?',
                'for angka in range(5):\n    if angka == 3:\n        break\n    print(angka)',
                ['0, 1, 2', '0, 1, 2, 3', '3, 4', '0, 1, 2, 3, 4'],
                'Loop berhenti ketika angka bernilai 3, sebelum print dijalankan.',
            ),
            q(
                'Urutan angka apa yang dicetak?',
                'for angka in range(4):\n    if angka == 2:\n        continue\n    print(angka)',
                ['0, 1, 3', '0, 1', '0, 1, 2, 3', '2'],
                'continue melewati print untuk angka 2 lalu loop berlanjut.',
            ),
            q(
                'Nilai apa saja yang dihasilkan range berikut?',
                'range(1, 6, 2)',
                ['1, 3, 5', '1, 2, 3, 4, 5, 6', '1, 3, 5, 6', '2, 4, 6'],
                'Dimulai dari 1, bertambah 2, dan berhenti sebelum 6.',
            ),
        ],
        fills: [
            f(
                'Berhenti saat target ditemukan',
                'Hentikan loop saat angka sama dengan 3.',
                [
                    'for angka in range(5):\n    if angka == 3:\n        ',
                    '\n    print(angka)',
                ],
                [['break', 'continue', 'pass', 'return']],
                'Pencarian selesai sehingga seluruh loop harus berhenti.',
            ),
            f(
                'Lewati nilai negatif',
                'Lewati angka negatif, tetapi lanjutkan memproses angka lain.',
                [
                    'for angka in [-1, 2, 3]:\n    if angka < 0:\n        ',
                    '\n    print(angka)',
                ],
                [['continue', 'break', 'pass', 'return']],
                'Hanya putaran saat ini yang dilewati.',
            ),
        ],
    },
    {
        title: 'Menambah, Menghapus, dan Menelusuri List',
        description:
            'Mengubah isi list dan menghitung hasil dari kumpulan data.',
        concepts: [
            c(
                'append menambah satu item di akhir',
                'List dapat diubah setelah dibuat. append(item) menambahkan satu item ke akhir list. Metode ini mengubah list asal dan mengembalikan None, sehingga jangan menulis barang = barang.append(...). extend() berbeda: ia menambahkan tiap elemen dari koleksi lain.',
                'barang = ["buku"]\nbarang.append("pensil")\nprint(barang)',
            ),
            c(
                'pop dan remove menghapus dengan cara berbeda',
                'pop(indeks) menghapus sekaligus mengembalikan item pada indeks tersebut. Tanpa argumen, pop() mengambil item terakhir. remove(nilai) menghapus kemunculan pertama nilai yang sama. remove() akan menimbulkan ValueError jika nilai tidak ditemukan.',
                'barang = ["buku", "pensil", "penghapus"]\nterakhir = barang.pop()\nbarang.remove("buku")\nprint(barang)\nprint(terakhir)',
            ),
            c(
                'Akumulator menyimpan hasil sementara',
                'Mulai total dari nol, lalu tambahkan setiap angka di dalam loop. Nilai total harus disiapkan sebelum loop agar tidak kembali nol pada setiap putaran. Untuk penjumlahan sederhana, sum(list_angka) merupakan cara singkat dengan hasil yang sama.',
                'nilai = [10, 20, 30]\ntotal = 0\nfor angka in nilai:\n    total += angka\nprint(total)',
            ),
        ],
        quizzes: [
            q(
                'Apa isi barang setelah kode ini?',
                'barang = ["buku"]\nbarang.append("pensil")',
                [
                    '["buku", "pensil"]',
                    '["pensil", "buku"]',
                    '["buku"]',
                    'None',
                ],
                'append menambahkan pensil setelah item yang sudah ada.',
            ),
            q(
                'Apa nilai terakhir?',
                'angka = [4, 7, 9]\nterakhir = angka.pop()',
                ['9', '4', '7', 'None'],
                'pop() tanpa indeks menghapus sekaligus mengembalikan item terakhir.',
            ),
            q(
                'Apa output kode berikut?',
                'total = 0\nfor angka in [10, 20, 30]:\n    total += angka\nprint(total)',
                ['60', '30', '0', '102030'],
                'Akumulator menjumlahkan 10 + 20 + 30 menjadi 60.',
            ),
        ],
        fills: [
            f(
                'Tambah satu barang',
                'Tambahkan pensil ke akhir list.',
                ['barang = ["buku"]\nbarang.', '("pensil")'],
                [['append', 'pop', 'remove', 'sort']],
                'Metode ini menerima satu item yang ingin ditambahkan.',
            ),
            f(
                'Jumlahkan nilai',
                'Siapkan total di luar loop, lalu tambahkan setiap angka.',
                [
                    'total = ',
                    '\nfor angka in [2, 4, 6]:\n    total ',
                    ' angka\nprint(total)',
                ],
                [
                    ['0', '1', '12'],
                    ['+=', '-=', '='],
                ],
                'Akumulator penjumlahan dimulai dari nol.',
            ),
        ],
    },
    {
        title: 'Menyimpan Pasangan Data dalam Dictionary',
        description:
            'Mengakses nilai dengan key dan memakai get() untuk key opsional.',
        concepts: [
            c(
                'Dictionary memasangkan key dan value',
                'Gunakan dictionary untuk menyimpan informasi dengan nama yang jelas. Key dipisahkan dari value oleh titik dua. Akses pemain["nama"] mengambil nilai yang berpasangan dengan key nama. Key harus unik; memberi nilai pada key yang sama memperbarui nilai lama.',
                'pemain = {"nama": "Nara", "skor": 10}\nprint(pemain["nama"])\npemain["skor"] = 20',
            ),
            c(
                'get menyediakan nilai bawaan',
                'Mengakses key yang tidak ada dengan kurung siku menimbulkan KeyError. get(key, nilai_bawaan) mengembalikan nilai bawaan jika key tidak ditemukan. Tanpa nilai bawaan, hasilnya None. Pemeriksaan key in dictionary memeriksa key, bukan value.',
                'pemain = {"nama": "Nara"}\nprint(pemain.get("skor", 0))\nprint("nama" in pemain)',
            ),
            c(
                'items membaca key dan value bersama',
                'Gunakan items() untuk memperoleh pasangan key dan value saat melakukan iterasi. Dua variabel di sebelah for menerima pasangan tersebut. Ini berguna untuk menampilkan ringkasan profil atau isi inventaris tanpa mengakses satu per satu secara manual.',
                'stok = {"buku": 3, "pensil": 5}\nfor nama, jumlah in stok.items():\n    print(f"{nama}: {jumlah}")',
            ),
        ],
        quizzes: [
            q(
                'Apa nilai yang ditampilkan?',
                'pemain = {"nama": "Nara", "skor": 10}\nprint(pemain["nama"])',
                ['Nara', 'nama', '10', 'KeyError'],
                'Key nama berpasangan dengan value Nara.',
            ),
            q(
                'Apa output kode berikut?',
                'pemain = {"nama": "Nara"}\nprint(pemain.get("skor", 0))',
                ['0', 'None', 'KeyError', 'skor'],
                'Key skor tidak ada sehingga get menggunakan nilai bawaan 0.',
            ),
            q(
                'Apa yang diperiksa oleh kode berikut?',
                '"skor" in pemain',
                [
                    'Apakah key skor ada',
                    'Apakah value skor ada',
                    'Apakah skor bernilai True',
                    'Apakah pemain adalah list',
                ],
                'Pada dictionary, operator in memeriksa keberadaan key.',
            ),
        ],
        fills: [
            f(
                'Baca skor pemain',
                'Akses nilai melalui key skor.',
                ['pemain = {"nama": "Nara", "skor": 10}\nprint(pemain[', '])'],
                [['"skor"', '0', '"nama"', '10']],
                'Key bertipe string perlu tanda kutip.',
            ),
            f(
                'Gunakan stok bawaan',
                'Ambil key stok dan gunakan nol bila key belum tersedia.',
                ['produk = {"nama": "Buku"}\nprint(produk.', '("stok", ', '))'],
                [
                    ['get', 'items', 'pop'],
                    ['0', '1', '"stok"'],
                ],
                'get menerima key dan nilai bawaan sebagai dua argumen.',
            ),
        ],
    },
    {
        title: 'Memilih Tuple dan Set',
        description:
            'Membedakan data tetap berurutan dari kumpulan nilai unik.',
        concepts: [
            c(
                'Tuple cocok untuk kelompok nilai tetap',
                'Tuple menyimpan beberapa nilai secara berurutan, tetapi elemennya tidak bisa diganti melalui indeks. Contohnya pasangan koordinat. Koma membentuk tuple; tuple satu item ditulis (5,), bukan (5). Elemen tuple tetap dapat dibaca menggunakan indeks seperti list.',
                'posisi = (3, 5)\nprint(posisi[0])\nsatu_item = (5,)',
            ),
            c(
                'Unpacking memberi nama pada setiap nilai',
                'Penulisan x, y = posisi memisahkan dua nilai ke dua variabel. Jumlah variabel harus sesuai dengan jumlah nilai, kecuali menggunakan bentuk unpacking berbintang yang belum dibahas di sini. Unpacking memudahkan membaca pasangan koordinat dan hasil fungsi.',
                'posisi = (3, 5)\nx, y = posisi\nprint(x + y)',
            ),
            c(
                'Set menyimpan nilai unik',
                'Set menghilangkan duplikat dan tidak menyediakan indeks atau urutan tampilan yang dijamin. Gunakan set untuk memeriksa keanggotaan dan banyaknya nilai unik. Set kosong dibuat dengan set(); tanda {} tanpa isi membuat dictionary kosong.',
                'kode = {"A", "A", "B"}\nprint(len(kode))\nkosong = set()',
            ),
        ],
        quizzes: [
            q(
                'Penulisan mana yang membuat tuple satu item?',
                '',
                ['(5,)', '(5)', '[5]', '{5}'],
                'Koma setelah 5 membuat tuple satu item.',
            ),
            q(
                'Apa output kode berikut?',
                'posisi = (3, 5)\nx, y = posisi\nprint(x + y)',
                ['8', '35', '3', '5'],
                'Unpacking memberi x nilai 3 dan y nilai 5, lalu keduanya dijumlahkan.',
            ),
            q(
                'Berapa banyak elemen dalam kode?',
                'kode = {"A", "A", "B"}\nprint(len(kode))',
                ['2', '3', '1', '0'],
                'Set hanya menyimpan nilai unik A dan B.',
            ),
        ],
        fills: [
            f(
                'Bongkar pasangan koordinat',
                'Pilih nilai tuple agar x menjadi 3 dan y menjadi 5.',
                ['posisi = ', '\nx, y = posisi\nprint(x, y)'],
                [['(3, 5)', '(5, 3)', '(3,)', '3']],
                'Unpacking mengikuti urutan nilai dalam tuple.',
            ),
            f(
                'Buat kumpulan unik',
                'Ubah list menjadi set dan hitung jumlah nilai uniknya.',
                ['angka = [1, 1, 2]\nunik = ', '(angka)\nprint(', '(unik))'],
                [
                    ['set', 'list', 'tuple'],
                    ['len', 'str', 'sum'],
                ],
                'set menghapus duplikat; len menghitung jumlah elemen.',
            ),
        ],
    },
    {
        title: 'Mengembalikan Hasil dari Fungsi',
        description:
            'Menggunakan return, parameter, dan nilai bawaan tanpa tertukar dengan print.',
        concepts: [
            c(
                'return mengirim hasil ke pemanggil',
                'print() menampilkan teks, sedangkan return memberikan nilai agar dapat disimpan atau dipakai dalam perhitungan lain. return juga mengakhiri pemanggilan fungsi saat itu. Fungsi yang selesai tanpa return bernilai akan menghasilkan None.',
                'def tambah(a, b):\n    return a + b\n\nhasil = tambah(2, 3)\nprint(hasil * 2)',
            ),
            c(
                'Parameter hanya tersedia dalam lingkup fungsi',
                'Parameter menerima nilai ketika fungsi dipanggil. Nama yang dibuat di dalam fungsi umumnya merupakan variabel lokal. Variabel hasil di luar fungsi berbeda dari nama total di dalamnya. Kembalikan nilai yang dibutuhkan daripada bergantung pada perubahan variabel global.',
                'def hitung_total(harga, jumlah):\n    total = harga * jumlah\n    return total\n\nhasil = hitung_total(5000, 2)',
            ),
            c(
                'Nilai bawaan membuat argumen opsional',
                'Parameter dapat memiliki nilai bawaan, misalnya jumlah=1. Nilai itu dipakai bila argumen tidak diberikan. Argumen bernama membantu memperjelas maksud pemanggilan. Untuk sementara gunakan angka atau string sebagai nilai bawaan; hindari list yang dapat berubah sebagai default.',
                'def total(harga, jumlah=1):\n    return harga * jumlah\n\nprint(total(5000))\nprint(total(harga=5000, jumlah=2))',
            ),
        ],
        quizzes: [
            q(
                'Apa output kode berikut?',
                'def tambah(a, b):\n    return a + b\n\nprint(tambah(2, 3) * 2)',
                ['10', '5', '23', 'None'],
                'Fungsi mengembalikan 5, kemudian hasil itu dikalikan 2.',
            ),
            q(
                'Apa nilai hasil setelah fungsi dipanggil?',
                'def sapa():\n    print("Halo")\n\nhasil = sapa()',
                ['None', 'Halo', 'True', '0'],
                'Fungsi hanya mencetak dan tidak mengembalikan nilai, sehingga hasil adalah None.',
            ),
            q(
                'Apa output kode berikut?',
                'def total(harga, jumlah=1):\n    return harga * jumlah\n\nprint(total(5000))',
                ['5000', '0', '1', 'Error karena argumen kurang'],
                'jumlah menggunakan nilai bawaan 1.',
            ),
        ],
        fills: [
            f(
                'Kembalikan jumlah',
                'Kirim hasil penjumlahan ke pemanggil fungsi.',
                ['def tambah(a, b):\n    ', ' a + b\n\nprint(tambah(2, 3))'],
                [['return', 'print', 'break', 'input']],
                'Hasil harus dapat digunakan kembali di luar fungsi.',
            ),
            f(
                'Beri jumlah bawaan',
                'Jika jumlah tidak diberikan, hitung harga satu barang.',
                [
                    'def total(harga, jumlah=',
                    '):\n    return harga ',
                    ' jumlah',
                ],
                [
                    ['1', '0', '2'],
                    ['*', '+', '-'],
                ],
                'Satu barang berarti harga dikalikan satu.',
            ),
        ],
    },
    {
        title: 'Menangani Input Tidak Valid',
        description:
            'Memakai try dan except ValueError agar kesalahan konversi dapat ditangani.',
        concepts: [
            c(
                'Kesalahan konversi bisa ditangani',
                'Kode yang mungkin gagal ditempatkan di blok try. Jika int() tidak bisa membaca teks sebagai bilangan bulat, Python menimbulkan ValueError. Blok except ValueError menangani kasus tersebut. Ini berbeda dari memperbaiki SyntaxError pada penulisan program.',
                'try:\n    jumlah = int("dua")\nexcept ValueError:\n    print("Masukkan angka bulat")',
            ),
            c(
                'Tangkap jenis error yang diketahui',
                'Sebutkan ValueError untuk kesalahan nilai konversi yang sedang ditangani. Menangkap semua exception tanpa alasan dapat menyembunyikan bug lain. Bila konversi gagal, jangan langsung menggunakan variabel yang belum berhasil diberi nilai. Sediakan jalur yang jelas untuk kasus berhasil dan gagal.',
                'try:\n    jumlah = int(input("Jumlah: "))\nexcept ValueError:\n    print("Input bukan angka bulat")\nelse:\n    print(jumlah * 5000)',
            ),
            c(
                'else berjalan jika try berhasil',
                'Pada try–except, else dijalankan jika blok try selesai tanpa exception. finally, jika ditulis, berjalan baik saat berhasil maupun gagal dan biasanya dipakai untuk pembersihan sumber daya. Latihan ini cukup menggunakan else agar perhitungan hanya dilakukan setelah konversi berhasil.',
                'try:\n    jumlah = int("3")\nexcept ValueError:\n    print("Tidak valid")\nelse:\n    print(jumlah + 1)',
            ),
        ],
        quizzes: [
            q(
                'Pesan mana yang ditampilkan?',
                'try:\n    jumlah = int("dua")\nexcept ValueError:\n    print("Masukkan angka bulat")',
                ['Masukkan angka bulat', 'dua', '0', 'Tidak ada output'],
                'int("dua") menimbulkan ValueError, lalu blok except menampilkan pesan.',
            ),
            q(
                'Jenis error apa yang perlu ditangani untuk konversi berikut?',
                'int("abc")',
                ['ValueError', 'KeyError', 'IndexError', 'NameError'],
                'Teks ada tetapi nilainya tidak dapat dikonversi menjadi integer.',
            ),
            q(
                'Apa output kode berikut?',
                'try:\n    angka = int("3")\nexcept ValueError:\n    print("Tidak valid")\nelse:\n    print(angka + 1)',
                ['4', 'Tidak valid', '3', 'None'],
                'Konversi berhasil sehingga else dijalankan dan mencetak 4.',
            ),
        ],
        fills: [
            f(
                'Tangani konversi yang gagal',
                'Lengkapi blok penanganan untuk input yang bukan angka bulat.',
                [
                    'try:\n    jumlah = int("dua")\n',
                    ' ',
                    ':\n    print("Input tidak valid")',
                ],
                [
                    ['except', 'else', 'if'],
                    ['ValueError', 'KeyError', 'IndexError'],
                ],
                'Gunakan except dan jenis error konversi nilai.',
            ),
            f(
                'Hitung hanya setelah berhasil',
                'Pilih blok yang berjalan jika try tidak menimbulkan error.',
                [
                    'try:\n    jumlah = int("3")\nexcept ValueError:\n    print("Tidak valid")\n',
                    ':\n    print(jumlah * 5000)',
                ],
                [['else', 'finally', 'elif', 'except']],
                'finally juga berjalan ketika gagal; latihan ini membutuhkan jalur berhasil saja.',
            ),
        ],
    },
    {
        title: 'Proyek Mini: Ringkasan Belanja',
        description:
            'Menggabungkan list, dictionary, fungsi, loop, dan format pesan untuk menghitung belanja.',
        concepts: [
            c(
                'Mulai dari bentuk data',
                'Simpan setiap barang sebagai dictionary berisi nama, harga, dan jumlah. Gabungkan barang-barang itu dalam list keranjang. Gunakan angka untuk harga dan jumlah agar dapat dihitung. Contoh ini memakai harga dalam rupiah bulat dan tidak menerima input pengguna.',
                'keranjang = [\n    {"nama": "Buku", "harga": 5000, "jumlah": 2},\n    {"nama": "Pensil", "harga": 2000, "jumlah": 3},\n]',
            ),
            c(
                'Pisahkan hitungan subtotal',
                'Fungsi subtotal menghitung harga dikali jumlah untuk satu barang. Loop memanggil fungsi itu untuk setiap barang, kemudian menambah hasilnya ke total. Dengan memisahkan perhitungan, aturan lebih mudah dibaca dan diuji menggunakan satu contoh barang.',
                'def subtotal(barang):\n    return barang["harga"] * barang["jumlah"]\n\ntotal = 0\nfor barang in keranjang:\n    total += subtotal(barang)',
            ),
            c(
                'Periksa hasil dengan contoh kecil',
                'Dua buku seharga 5000 menghasilkan 10000. Tiga pensil seharga 2000 menghasilkan 6000. Total keduanya 16000. Periksa juga keranjang kosong: total harus tetap nol. Setelah perhitungan benar, tampilkan ringkasan dengan f-string.',
                'total = 16000\nprint(f"Total belanja: Rp{total}")',
            ),
        ],
        quizzes: [
            q(
                'Berapa subtotal barang berikut?',
                'barang = {"nama": "Buku", "harga": 5000, "jumlah": 2}\nprint(barang["harga"] * barang["jumlah"])',
                ['10000', '5002', '5000', '2'],
                'Dua buku dengan harga satuan 5000 menghasilkan subtotal 10000.',
            ),
            q(
                'Berapa total belanja setelah loop selesai?',
                'keranjang = [\n    {"harga": 5000, "jumlah": 2},\n    {"harga": 2000, "jumlah": 3},\n]\ntotal = 0\nfor barang in keranjang:\n    total += barang["harga"] * barang["jumlah"]',
                ['16000', '7000', '10000', '6000'],
                'Subtotal 10000 dan 6000 dijumlahkan menjadi 16000.',
            ),
            q(
                'Apa output ketika keranjang kosong?',
                'keranjang = []\ntotal = 0\nfor barang in keranjang:\n    total += barang["harga"] * barang["jumlah"]\nprint(total)',
                ['0', 'None', 'Error', '1'],
                'Tidak ada putaran loop, sehingga total tetap pada nilai awal nol.',
            ),
        ],
        fills: [
            f(
                'Lengkapi fungsi subtotal',
                'Kembalikan harga satuan dikali jumlah barang.',
                [
                    'def subtotal(barang):\n    ',
                    ' barang["harga"] ',
                    ' barang["jumlah"]',
                ],
                [
                    ['return', 'print', 'break'],
                    ['*', '+', '-'],
                ],
                'Subtotal adalah hasil perkalian harga dan jumlah.',
            ),
            f(
                'Tampilkan total belanja',
                'Jumlahkan semua subtotal lalu sisipkan total ke pesan.',
                [
                    'total = 0\nfor barang in keranjang:\n    total ',
                    ' subtotal(barang)\nprint(f"Total belanja: Rp{',
                    '}")',
                ],
                [
                    ['+=', '=', '-='],
                    ['total', 'barang', 'keranjang'],
                ],
                'Gunakan akumulator penjumlahan dan nilai total akhirnya.',
            ),
        ],
    },
];

const groups = [
    [
        'Input dan Pengolahan Teks',
        'Menerima input, merangkai pesan, dan mengolah string.',
    ],
    [
        'Kontrol Alur Lanjutan',
        'Menggabungkan kondisi, memilih cabang, dan mengendalikan loop.',
    ],
    ['Koleksi Data Python', 'Mengolah list, dictionary, tuple, dan set.'],
    [
        'Fungsi dan Program yang Tahan Error',
        'Mengembalikan hasil, menangani input tidak valid, dan menyusun proyek belanja.',
    ],
];

const path = new URL(
    '../database/seeders/data/content-dump.json',
    import.meta.url,
);
const dump: ContentDump = JSON.parse(readFileSync(path, 'utf8'));
const course = dump.courses.find((item) => item.id === 'python-fundamentals');
if (!course) throw new Error('Kursus Python tidak ditemukan.');

for (const [groupIndex, [title, description]] of groups.entries()) {
    const unit: ExportedUnit = {
        id: `python-unit-${11 + groupIndex}`,
        title,
        description,
        lessons: lessons
            .slice(groupIndex * 3, groupIndex * 3 + 3)
            .map((lesson, index) => {
                const id = `python-fundamentals-lesson-${11 + groupIndex * 3 + index}`;
                const concept = (index: number): Omit<ExportedStep, 'id'> => ({
                    type: 'concept',
                    reward: { xp: 0 },
                    content: {
                        ...lesson.concepts[index],
                        eyebrow: 'Python Lanjutan',
                    },
                });
                const quiz = (index: number): Omit<ExportedStep, 'id'> => ({
                    type: 'quiz',
                    reward: { xp: 5 },
                    content: {
                        question: lesson.quizzes[index].question,
                        code: lesson.quizzes[index].code,
                        language: 'python',
                        options: lesson.quizzes[index].options.map(
                            (label, i) => ({ id: `option-${i + 1}`, label }),
                        ),
                        explanation: lesson.quizzes[index].explanation,
                    },
                    validation: { correctOptionId: 'option-1' },
                });
                const fill = (index: number): Omit<ExportedStep, 'id'> => {
                    const source = lesson.fills[index];
                    return {
                        type: 'code-fill',
                        reward: { xp: 5 },
                        content: {
                            title: source.title,
                            instructions: source.instructions,
                            language: 'python',
                            parts: source.parts,
                            hint: source.hint,
                            blanks: source.options.map((options, i) => ({
                                id: `blank-${i + 1}`,
                                mode: 'choice',
                                options,
                            })),
                        },
                        validation: {
                            acceptedAnswers: Object.fromEntries(
                                source.options.map((options, i) => [
                                    `blank-${i + 1}`,
                                    [options[0]],
                                ]),
                            ),
                        },
                    };
                };
                return {
                    id,
                    title: lesson.title,
                    description: lesson.description,
                    completionRewardXp: 25,
                    steps: [
                        concept(0),
                        quiz(0),
                        fill(0),
                        concept(1),
                        quiz(1),
                        concept(2),
                        fill(1),
                        quiz(2),
                    ].map((step, i) => ({
                        id: `${id}-step-${i + 1}`,
                        ...step,
                    })),
                };
            }),
    };
    const existing = course.units.find((item) => item.id === unit.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(unit))
        throw new Error(`Unit ${unit.id} sudah memiliki perubahan lokal.`);
    if (!existing) course.units.push(unit);
}
assertUniqueIds(dump.courses);
writeFileSync(path, JSON.stringify(dump, null, 2) + '\n');
writeFileSync(
    new URL('../database/seeders/data/content-dump.meta.json', import.meta.url),
    JSON.stringify(summarize(dump), null, 2) + '\n',
);
console.log('Python: 12 pelajaran baru, 96 langkah; metadata diperbarui.');
