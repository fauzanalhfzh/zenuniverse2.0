{{--
    Pratinjau admin: hanya field publik dari PublishedContent. Tidak menulis
    progress/XP dan tidak pernah menampilkan validation/expectedCode.
--}}
<div class="space-y-4">
    @if ($lesson === null)
        <p class="text-sm text-gray-500">Belum ada lesson untuk dipratinjau.</p>
    @else
        <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Pratinjau lesson</p>
            <h3 class="text-lg font-bold">{{ $lesson['title'] }}</h3>
            <p class="text-sm text-gray-600">{{ $lesson['description'] }}</p>
            <p class="text-xs text-gray-500">Revisi konten: {{ $lesson['contentRevision'] }}</p>
        </div>

        <ol class="space-y-3">
            @foreach ($lesson['steps'] as $index => $step)
                <li class="rounded-lg border border-gray-200 p-3">
                    <p class="text-xs font-semibold text-gray-500">
                        #{{ $index + 1 }} · {{ $step['type'] }} · {{ $step['reward']['xp'] }} XP
                    </p>
                    <p class="mt-1 text-sm font-semibold">
                        {{ data_get($step, 'content.title') ?? data_get($step, 'content.question') ?? data_get($step, 'content.instructions') ?? data_get($step, 'content.prompt') ?? data_get($step, 'content.body') }}
                    </p>
                    @if (! empty($step['content']['options']))
                        <ul class="mt-2 list-disc pl-5 text-sm text-gray-700">
                            @foreach ($step['content']['options'] as $option)
                                <li>{{ $option['label'] }}</li>
                            @endforeach
                        </ul>
                    @endif
                    @if (! empty($step['content']['tokens']))
                        <p class="mt-2 text-sm text-gray-500">Token: {{ count($step['content']['tokens']) }} potongan</p>
                    @endif
                </li>
            @endforeach
        </ol>
    @endif
</div>
