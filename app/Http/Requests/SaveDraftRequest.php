<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveDraftRequest extends FormRequest
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
            'document' => ['required', 'array'],
            'document.id' => ['required', 'string', 'max:160'],
            'document.title' => ['required', 'string', 'max:255'],
            'document.description' => ['required', 'string'],
            'document.level' => ['required', 'string', 'max:255'],
            'document.units' => ['present', 'array', 'max:200'],
            'expected_revision' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
