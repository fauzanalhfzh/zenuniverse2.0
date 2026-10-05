<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Resources\Json\JsonResource;

class ApiResource extends JsonResource
{
    public function toArray($request): array
    {
        return $this->resource;
    }

    public function with($request): array
    {
        return ['meta' => ['requestId' => $request->attributes->get('requestId')]];
    }
}
