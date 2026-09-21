const photos = [
    {
        src: '/images/about/banner-1.webp',
        alt: 'Peserta ZenUniverse berkumpul belajar bersama di depan laptop',
        className: 'h-[210px]',
    },
    {
        src: '/images/about/banner-2.webp',
        alt: 'Suasana diskusi komunitas ZenUniverse sambil berbagi ilmu',
        className: 'h-[170px]',
    },
    {
        src: '/images/about/banner-3.webp',
        alt: 'Anggota komunitas ZenUniverse berfoto bersama setelah sesi belajar',
        className: 'h-[170px]',
    },
] as const;

export function About() {
    return (
        <section
            id="tentang-kami"
            aria-labelledby="tentang-kami-judul"
            className="bg-white"
        >
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-5 pt-16 pb-[88px] sm:px-10 xl:flex-row xl:items-center xl:gap-16 xl:px-[140px]">
                <div className="flex w-full flex-col gap-5 lg:max-w-[560px]">
                    <p className="text-[14px] font-semibold text-[#4338ca]">
                        Dari komunitas, untuk yang penasaran.
                    </p>
                    <h2
                        id="tentang-kami-judul"
                        className="font-display text-[30px] leading-[1.15] font-medium text-[#ea6a12] sm:text-[38px] lg:leading-[43px]"
                    >
                        Lahir dari kebingungan. <br />
                        Tumbuh dari kebersamaan.
                    </h2>
                    <p className="text-[19px] leading-[29px] text-[#334155]">
                        “Kenapa kita nggak ciptakan aja ruangnya, tempat untuk
                        berkumpul dan berbagi ilmu?”
                    </p>
                    <p className="text-[17px] leading-[27px] text-[#475569]">
                        Di awal masa kuliah, kami punya pertanyaan yang sama:
                        mulai belajar dari mana, dan sama siapa? Materi sains,
                        coding, dan teknologi tersebar di mana-mana.
                    </p>
                    <p className="text-[17px] leading-[27px] text-[#475569]">
                        Dari kebingungan itu, Zenuniverse lahir. Sebuah ruang
                        yang hangat dan terbuka, karena ilmu lebih bermakna
                        ketika dibagikan dan belajar lebih seru ketika bersama.
                    </p>
                    <p className="text-[16px] text-[#475569]">
                        Selama masih ada yang penasaran, perjalanan ini terus
                        berlanjut.
                    </p>
                </div>
                <div className="flex w-full flex-1 flex-col gap-3.5">
                    {photos.map((photo) => (
                        <img
                            key={photo.src}
                            src={photo.src}
                            alt={photo.alt}
                            width={760}
                            height={210}
                            className={`w-full rounded-[18px] object-cover ${photo.className}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
