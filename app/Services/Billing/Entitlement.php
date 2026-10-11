<?php

namespace App\Services\Billing;

use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonImmutable;

class Entitlement
{
    /** @return array{plusActive: bool, accessUntil: ?string, revision: int, evaluatedAt: string, checkoutAvailable: bool} */
    public function forUser(User $user): array
    {
        $now = CarbonImmutable::now('UTC');
        $subscriptions = $user->subscriptions()->get();
        $valid = $subscriptions->filter(fn (Subscription $subscription): bool => in_array($subscription->provider, ['mayar', 'google_play'], true)
            && in_array($subscription->status, ['active', 'grace', 'canceled'], true)
            && $subscription->verified_at !== null
            && $subscription->verified_at->lte($now)
            && $subscription->starts_at !== null
            && $subscription->ends_at !== null
            && $subscription->starts_at->lte($now)
            && $subscription->ends_at->gt($now)
            && $subscription->starts_at->lt($subscription->ends_at)
        );
        $until = $valid->sortByDesc(fn (Subscription $subscription) => $subscription->ends_at?->getTimestamp())->first()?->ends_at;

        return [
            'plusActive' => $until !== null,
            'accessUntil' => $until?->utc()->toISOString(),
            'revision' => (int) $subscriptions->sum('entitlement_revision'),
            'evaluatedAt' => $now->toISOString(),
            'checkoutAvailable' => false,
        ];
    }
}
