import { Heart } from "lucide-react";
import { getUserOnboardingSnapshot } from "@/lib/auth/session";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { FloatingHearts } from "@/components/animations/FloatingHearts";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; inviteError?: string }>;
}) {
  const params = await searchParams;
  const snapshot = await getUserOnboardingSnapshot();

  return (
    <div className="relative min-h-screen px-4 py-10 romantic-bg">
      <FloatingHearts style="gentle" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-roseDark text-white shadow-romantic">
            <Heart className="h-6 w-6" fill="currentColor" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-brand-dark sm:text-3xl">
            Atur Ruang Pasangan Kalian
          </h1>
          <p className="mt-1 text-sm text-brand-brown">
            Dynamic Couple Profile — semua data tersimpan otomatis di database tanpa hardcode.
          </p>
          {params.inviteError && (
            <p className="mx-auto mt-3 max-w-lg rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-700 border border-rose-200">
              Catatan kode undangan: {params.inviteError}
            </p>
          )}
        </div>

        <OnboardingWizard
          userId={snapshot.user.id}
          initialProfile={snapshot.profile}
          initialSpace={snapshot.coupleSpace}
          initialSettings={snapshot.settings}
          initialInvite={snapshot.activeInvitation}
          initialInviteCodeFromUrl={params.invite ?? ""}
          isAlreadyInCouple={Boolean(snapshot.member)}
        />
      </div>
    </div>
  );
}
