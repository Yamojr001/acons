<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'           => 'required|string|max:100',
            'term'            => 'required|string|max:50',
            'amount'          => 'required|numeric|min:0',
            'due_date'        => 'required|date',
            'assignment_type' => 'required|in:all,class,individual',
            'student_id'      => 'nullable|required_if:assignment_type,individual|exists:students,id',
            'class_room_id'   => 'nullable|required_if:assignment_type,class|exists:class_rooms,id',
        ];
    }
}
