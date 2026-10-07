import { login } from '@/routes';

const outlineAction =
    'mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-[12px] border border-[#d9dee6] bg-white px-4 py-3 text-center text-[15px] font-bold text-[#0f172a] transition-colors hover:bg-[#f1f5f9] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#4338ca]';

export function Pricing() {
    return (
        <section id="harga" aria-labelledby="harga-judul" className="bg-white text-[#0f172a]">
            <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 lg:py-24">
                <div className="mx-auto mb-10 max-w-[680px] text-center sm:mb-12">
                    <p className="mb-4 text-sm font-bold text-[#ea6a12]">Harga paket</p>
                    <h2 id="harga-judul" className="font-display text-[36px] leading-[1.15] font-medium sm:text-[48px]">
                        Mulai gratis. <span className="block">Lanjutkan dengan Plus.</span>
                    </h2>
                    <p className="mt-5 text-[16px] leading-relaxed text-[#475569]">
                        Pilih Free atau Plus, dengan periode bulanan atau tahunan.
                    </p>
                </div>
                <div className="grid gap-5 lg:grid-cols-[0.85fr_2fr]">
                    <article aria-labelledby="paket-free" className="flex flex-col rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:p-7">
                        <h3 id="paket-free" className="font-display text-[27px] font-medium">Free</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#475569]">Mulai belajar tanpa biaya berlangganan.</p>
                        <p className="mt-8 text-[36px] leading-tight font-bold">Rp0</p>
                        <p className="mt-1 mb-10 text-sm text-[#475569]">per bulan</p>
                        <a href={login.url()} className={outlineAction}>Pilih Free</a>
                        <p className="mt-4 text-center text-xs text-[#475569]">Rp0 biaya langganan</p>
                    </article>
                    <div role="group" aria-labelledby="paket-plus" className="rounded-[22px] border border-[#ede5db] bg-[#fffcf8] p-5 sm:p-7">
                        <h3 id="paket-plus" className="font-display text-[27px] font-medium">ZenUniverse Plus</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#475569]">Satu paket Plus. Pilih periode yang cocok buatmu.</p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <article aria-labelledby="plus-bulanan" className="flex flex-col rounded-[16px] border border-[#e2e8f0] bg-white p-5">
                                <h4 id="plus-bulanan" className="text-[17px] font-bold">Bulanan</h4>
                                <p className="mt-5 text-[32px] leading-tight font-bold">Rp35.000</p>
                                <p className="mt-1 text-sm text-[#475569]">per bulan</p>
                                <p className="mt-4 mb-8 text-sm text-[#475569]">Bayar untuk 1 bulan Plus.</p>
                                <a href={login.url()} className={outlineAction}>Pilih Plus Bulanan</a>
                                <p className="mt-4 text-center text-xs text-[#475569]">Rp35.000 untuk 1 bulan</p>
                            </article>
                            <article aria-labelledby="plus-tahunan" className="flex flex-col rounded-[16px] border-2 border-[#ff8a3d] bg-[#fff3e5] p-5">
                                <h4 id="plus-tahunan" className="text-[17px] font-bold">Tahunan</h4>
                                <p className="mt-5 text-[32px] leading-tight font-bold">Rp300.000</p>
                                <p className="mt-1 text-sm text-[#475569]">per tahun</p>
                                <p className="mt-4 mb-8 text-sm text-[#475569]">Setara Rp25.000 per bulan.</p>
                                <a href={login.url()} className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#ff8a3d] px-4 py-3 text-center text-[15px] font-bold text-white shadow-[3px_10px_0_#9c4913] transition-[background-color,transform,box-shadow] hover:bg-[#f57c28] active:translate-x-[2px] active:translate-y-[7px] active:shadow-[1px_3px_0_#9c4913] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#4338ca]">Pilih Plus Tahunan</a>
                                <p className="mt-4 text-center text-xs text-[#475569]">Rp300.000 untuk 12 bulan</p>
                            </article>
                        </div>
                    </div>
                </div>
                <div className="mt-9 flex flex-col gap-5 border-b border-[#e2e8f0] pb-7 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-display text-[23px] font-medium">Setahun belajar, lebih hemat Rp120.000.</p>
                        <p className="mt-2 text-sm leading-relaxed text-[#475569]">Dibanding bayar bulanan selama 12 bulan.</p>
                    </div>
                    <div className="shrink-0 text-sm sm:text-right">
                        <p className="text-[#475569]">12 × Rp35.000 = Rp420.000</p>
                        <p className="mt-2 font-bold text-[#ea6a12]">Plus Tahunan Rp300.000</p>
                    </div>
                </div>
                <p className="mt-5 text-center text-xs leading-relaxed text-[#475569]">Pilihan paket belum melakukan pembayaran. Masuk untuk melanjutkan.</p>
            </div>
        </section>
    );
}
