<?php

namespace App\Enums;

enum StepType: string
{
    case Concept = 'concept';
    case Quiz = 'quiz';
    case Blockly = 'blockly';
    case CodeFill = 'code-fill';
    case Code = 'code';
}
