import { PrimaryCtaLink } from './primary-cta';

export function CTA() {
    return (
        <section aria-labelledby="ajakan-judul" className="bg-white">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-5 pt-16 pb-12 text-center sm:px-10">
                <h2
                    id="ajakan-judul"
                    className="font-display text-[34px] leading-[1.1] font-medium text-[#ea6a12] sm:text-[44px] lg:text-[50px] lg:leading-[55px]"
                >
                    Belajar coding,
                    <br />
                    bersama ZenUniverse
                </h2>
                <PrimaryCtaLink className="w-full max-w-[440px]" />
            </div>
        </section>
    );
}
