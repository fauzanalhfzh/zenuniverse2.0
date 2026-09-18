<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHeartSettingsRequest extends FormRequest
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
            'capacity' => ['required', 'integer', 'between:1,100'],
            'regen_minutes' => ['required', 'integer', 'between:1,1440'],
            'version' => ['required', 'integer', 'min:1'],
        ];
    }
}
