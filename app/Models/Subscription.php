<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * @property int $id
 * @property int $user_id
 * @property string $provider
 * @property string $provider_subscription_id
 * @property string $plan
 * @property string $status
 * @property CarbonImmutable|null $starts_at
 * @property CarbonImmutable|null $ends_at
 * @property CarbonImmutable|null $verified_at
 * @property int $entitlement_revision
 */
#[Hidden(['provider_subscription_id', 'provider_status'])]
class Subscription extends Model
{
    protected static function booted(): void
    {
        static::saving(function (Subscription $subscription): void {
            Validator::make($subscription->getAttributes(), [
                'user_id' => ['required', 'integer'],
                'provider' => ['required', Rule::in(['mayar', 'google_play'])],
                'provider_subscription_id' => ['required', 'string', 'max:255'],
                'plan' => ['required', Rule::in(['monthly', 'yearly'])],
                'status' => ['required', Rule::in(['pending', 'active', 'grace', 'canceled', 'hold', 'paused', 'expired', 'revoked', 'unknown'])],
                'starts_at' => ['nullable', 'date', 'required_with:ends_at'],
                'ends_at' => ['nullable', 'date', 'required_with:starts_at', 'after:starts_at'],
                'verified_at' => ['nullable', 'date'],
                'canceled_at' => ['nullable', 'date'],
            ])->validate();

            if ($subscription->exists && $subscription->isDirty(['user_id', 'provider', 'provider_subscription_id'])) {
                throw ValidationException::withMessages(['provider_subscription_id' => 'Subscription ownership cannot be changed.']);
            }

            if ($subscription->isDirty()) {
                $subscription->entitlement_revision = $subscription->exists
                    ? (int) $subscription->getRawOriginal('entitlement_revision') + 1
                    : 1;
            }
        });
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'canceled_at' => 'immutable_datetime',
            'verified_at' => 'immutable_datetime',
            'entitlement_revision' => 'integer',
        ];
    }

    public function fromDateTime($value)
    {
        return $value === null ? null : $this->asDateTime($value)->utc()->format($this->getDateFormat());
    }
}
