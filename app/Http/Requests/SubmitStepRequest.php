<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'lesson_id' => ['required', 'string', 'max:160'],
            'step_id' => ['required', 'string', 'max:160'],
            'attempt_id' => ['required', 'uuid'],
            'content_revision' => ['required', 'integer', 'min:1'],
            'answer' => ['required', 'array', 'max:32'],
            'answer.type' => ['required', 'string', 'in:concept,quiz,blockly,code-arrange,code-fill,code'],
            'answer.acknowledged' => ['sometimes', 'boolean'],
            'answer.optionId' => ['sometimes', 'string', 'max:160'],
            'answer.commands' => ['sometimes', 'array', 'max:500'],
            'answer.tokenIds' => ['sometimes', 'array', 'max:500'],
            'answer.answers' => ['sometimes', 'array', 'max:500'],
            'answer.code' => ['sometimes', 'string', 'max:20000'],
        ];
    }
}
