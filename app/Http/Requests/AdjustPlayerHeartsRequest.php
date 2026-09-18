<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdjustPlayerHeartsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'delta' => ['required', 'integer', 'between:-100,100'],
            'reason' => ['required', 'string', 'max:255'],
            'adjustment_id' => ['required', 'uuid'],
            'expected_hearts' => ['nullable', 'integer', 'between:0,100'],
        ];
    }
}
