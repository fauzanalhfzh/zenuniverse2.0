import { Head } from '@inertiajs/react';
import LearnerNavigation from '@/components/learner-navigation';
import { ProfileView } from '@/components/profile/profile-view';
import type { ProfileProps } from '@/types/profile';

export default function Profile(props: ProfileProps) {
    return (
        <>
            <Head title="Profil | ZenUniverse" />
            <main className="dashboard-shell learner-page-shell">
                <LearnerNavigation active="profile" />

                <div className="dashboard-workspace learner-page-workspace">
                    <section className="mx-auto w-full max-w-3xl px-4 py-10 pb-28 sm:px-8 lg:pb-10">
                        <ProfileView profile={props} />
                    </section>
                </div>
            </main>
        </>
    );
}
