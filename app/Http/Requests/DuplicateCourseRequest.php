<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DuplicateCourseRequest extends FormRequest
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
            'new_id' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9][a-z0-9-]*$/'],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }
}
